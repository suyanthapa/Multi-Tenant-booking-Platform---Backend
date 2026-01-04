import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //  Safety Check: Header Cleaning
  delete req.headers["x-user-id"];
  delete req.headers["x-user-role"];
  delete req.headers["x-user-email"];

  //  Check Cookies (Web/Browser)
  let token = req.cookies?.accessToken;

  //  Check Authorization Header (Mobile/Postman)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided" });
      return;
    }
    token = authHeader.substring(7); // Remove 'Bearer ' prefix
  }
  token = req.cookies?.accessToken || token;
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string
    ) as JWTPayload;
    req.user = decoded;

    // forward it to downstream services
    req.headers["x-user-id"] = decoded.userId;
    req.headers["x-user-role"] = decoded.role;
    req.headers["x-user-email"] = decoded.email;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};
