import { Request, Response, NextFunction } from "express";

/**
 * Wrapper for async route handlers to catch errors and pass to error middleware
 */
export const asyncHandler = (
  fn: Function,
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error(`[API ERROR] ${req.method} ${req.url}:`, err.message);
      next(err);
    });
  };
};
