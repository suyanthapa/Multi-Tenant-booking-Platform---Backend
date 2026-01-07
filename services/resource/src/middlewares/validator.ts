import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ValidationError } from "../utils/errors";

/**
 * Middleware to validate request body using Zod schemas
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // 1. Pass an object containing all request segments to Zod
      const validated = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // 2. Assign the validated data back to the request
      // Note: We only overwrite 'body' as 'params' and 'query' are often read-only in Express
      req.body = validated.body;
      req.params = validated.params;

      // If you need to access validated params/query in the controller,
      // they are now guaranteed to match your schema types.

      next();
    } catch (error: any) {
      if (error.name === "ZodError") {
        const errors = error.errors.map((err: any) => ({
          // This logic removes 'body.' or 'params.' from the start of the field name
          // making it cleaner for the frontend (e.g., 'username' instead of 'body.username')
          field:
            err.path.length > 1
              ? err.path.slice(1).join(".")
              : err.path.join("."),
          message: err.message,
        }));

        next(new ValidationError("Validation failed", errors));
      } else {
        next(error);
      }
    }
  };
};
