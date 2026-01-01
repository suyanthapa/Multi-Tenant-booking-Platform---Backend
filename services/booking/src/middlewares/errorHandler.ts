import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import logger from "../utils/logger";

/**
 * Global error handling middleware
 * IMPORTANT: Must have 4 parameters for Express to recognize it as error handler
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Default error values
  let statusCode = 500;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected error occurred";
  let errors: any[] | undefined;

  // Log error details (always log full details internally)
  logger.error("Error occurred:", {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Handle known operational errors (custom AppError instances)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code || "INTERNAL_SERVER_ERROR";
    message = err.message;

    // Check if it has validation errors
    if ("errors" in err && Array.isArray((err as any).errors)) {
      errors = (err as any).errors;
    }

    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        ...(errors && { errors }),
        ...(process.env.NODE_ENV === "development" && {
          stack: err.stack,
        }),
      },
    });
  }

  // Handle Prisma errors
  if (err.constructor.name === "PrismaClientKnownRequestError") {
    const prismaError = err as any;
    if (prismaError.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: {
          code: "DUPLICATE_ENTRY",
          message: "A record with this value already exists",
        },
      });
    }
    if (prismaError.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Record not found",
        },
      });
    }
  }

  // Handle validation errors from Zod
  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        errors: (err as any).errors,
      },
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid token",
      },
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: {
        code: "TOKEN_EXPIRED",
        message: "Token has expired",
      },
    });
  }

  // Handle syntax errors (invalid JSON in request body)
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_JSON",
        message: "Invalid JSON in request body",
      },
    });
  }

  // Unknown errors - don't expose internal details in production
  if (process.env.NODE_ENV === "production") {
    message = "Internal server error";
  } else {
    message = err.message || "An unexpected error occurred";
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === "development" && {
        stack: err.stack,
      }),
    },
  });
};

/**
 * 404 Not Found Handler
 * Call this AFTER all routes are registered
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.originalUrl} not found`,
    },
  });
};
