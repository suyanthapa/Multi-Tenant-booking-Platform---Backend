import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import logger from "../utils/logger";
import { sanitizeBody } from "../utils/sanitizer";
import { errorResponse } from "../utils/response";

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Log error details (always log full details internally)
  logger.error("Error occurred:", {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    body: sanitizeBody(req.body),
    params: req.params,
    query: req.query,
  });

  // AppError
  if (err instanceof AppError) {
    const errors =
      "errors" in err && Array.isArray((err as any).errors)
        ? (err as any).errors
        : undefined;

    return errorResponse(
      res,
      err.message,
      err.statusCode,
      err.code,
      errors,
      err.stack,
    );
  }

  // Prisma errors
  if (err.constructor.name === "PrismaClientKnownRequestError") {
    const prismaError = err as any;
    if (prismaError.code === "P2002") {
      return errorResponse(
        res,
        "A record with this value already exists",
        409,
        "DUPLICATE_ENTRY",
        undefined,
        err.stack,
      );
    }
    if (prismaError.code === "P2025") {
      return errorResponse(
        res,
        "Record not found",
        404,
        "NOT_FOUND",
        undefined,
        err.stack,
      );
    }
  }

  // Zod
  if (err.name === "ZodError") {
    return errorResponse(
      res,
      "Validation failed",
      400,
      "VALIDATION_ERROR",
      (err as any).errors,
      err.stack,
    );
  }

  // JWT
  if (err.name === "JsonWebTokenError") {
    return errorResponse(
      res,
      "Invalid token",
      401,
      "INVALID_TOKEN",
      undefined,
      err.stack,
    );
  }

  //Token Expired
  if (err.name === "TokenExpiredError") {
    return errorResponse(
      res,
      "Token has expired",
      401,
      "TOKEN_EXPIRED",
      undefined,
      err.stack,
    );
  }

  // Fallback
  logger.error("Unhandled error:", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  return errorResponse(
    res,
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred. Please try again later."
      : err.message,
    500,
    "INTERNAL_SERVER_ERROR",
    undefined,
    err.stack,
  );
};

/**
 * Handle 404 - Route not found
 */
export const notFoundHandler = (req: Request, res: Response) => {
  return errorResponse(
    res,
    `Route ${req.method} ${req.url} not found`,
    404,
    "NOT_FOUND",
  );
};
