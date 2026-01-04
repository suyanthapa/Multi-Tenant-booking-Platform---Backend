import { Request, Response } from "express";

// gateway/src/middlewares/notFound.middleware.ts
export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    origin: "API-GATEWAY", // <--- Add this
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
};
