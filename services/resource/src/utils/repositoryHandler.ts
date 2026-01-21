import { Prisma } from "@prisma/client";
import {
  DatabaseError,
  ConflictError,
  BadRequestError,
  NotFoundError,
} from "./errors";

/**
 * Wrapper for repository methods to handle Prisma errors consistently
 * Similar to asyncHandler but specifically for database operations
 */
export const dbHandler = <T>(fn: (...args: any[]) => Promise<T>) => {
  return async (...args: any[]): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Re-throw known operational errors (custom errors from business logic)
      if (
        error instanceof NotFoundError ||
        error instanceof ConflictError ||
        error instanceof BadRequestError
      ) {
        throw error;
      }

      // Handle Prisma-specific errors with better context
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case "P2002":
            // Unique constraint violation
            const target = (error.meta?.target as string[]) || [];
            throw new ConflictError(
              `A record with this ${target.join(", ")} already exists`,
            );
          case "P2003":
            // Foreign key constraint violation
            throw new BadRequestError("Invalid reference to related data");
          case "P2025":
            // Record not found
            throw new NotFoundError("Record not found");
          case "P2014":
            // Relation violation
            throw new BadRequestError(
              "The change conflicts with a required relation",
            );
          default:
            throw new DatabaseError(`Database operation failed: ${error.code}`);
        }
      }

      // Handle Prisma validation errors
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new BadRequestError("Invalid data provided to database");
      }

      // Handle unexpected errors
      throw new DatabaseError(
        `Database operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };
};
