import { Request, Response, NextFunction } from "express";

export const notFound = (req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
};
