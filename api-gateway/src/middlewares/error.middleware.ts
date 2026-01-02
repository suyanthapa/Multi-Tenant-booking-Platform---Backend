import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);

  if (err.code === "ECONNREFUSED") {
    return res.status(503).json({
      error: "Service unavailable",
    });
  }

  res.status(err.status || 500).json({
    error: "Internal gateway error",
  });
};
