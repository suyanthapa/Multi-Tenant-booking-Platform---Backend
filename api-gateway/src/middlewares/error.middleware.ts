import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error(err);

  if (err.code === "ECONNREFUSED") {
    return res.status(503).json({
      error: "Service unavailable",
    });
  }

  if (err.target) {
    res.status(502).json({
      error: "Service temporarily unavailable",
      service: err.target,
    });
  }

  res.status(err.status || 500).json({
    error: "Internal gateway error",
    timestamp: new Date().toISOString(),
  });
};
