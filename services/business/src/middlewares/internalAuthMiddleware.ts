import { Request, Response, NextFunction } from "express";
import { AuthenticationError } from "../utils/errors";

export const internalAuthMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const internalKey = req.headers["x-internal-key"];

  const validKey = process.env.INTERNAL_SERVICE_SECRET;

  if (!internalKey || internalKey !== validKey) {
    throw new AuthenticationError("Access Denied: Invalid Service Identity");
  }

  next();
};
