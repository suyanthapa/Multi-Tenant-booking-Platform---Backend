import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ValidationError } from "../utils/errors";

/**
 * Middleware to validate request body using Zod schemas
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      if (error.name === "ZodError") {
        const errors = error.errors.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        next(new ValidationError("Validation failed", errors));
      } else {
        next(error);
      }
    }
  };
};
