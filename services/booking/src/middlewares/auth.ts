import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticationError, AuthorizationError } from "../utils/errors";
import config from "../config";

// JWT Payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    return decoded as JWTPayload;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new AuthenticationError("Token has expired");
    }
    throw new AuthenticationError("Invalid token");
  }
};

/**
 * Middleware to authenticate requests using JWT
 * Handles both Web (Cookies) and Mobile/API (Bearer Token).
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    //  Check Cookies (Web/Browser)
    let token = req.cookies?.accessToken;

    //  Check Authorization Header (Mobile/Postman)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AuthenticationError("No token provided");
      }
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }

    if (!token) {
      throw new AuthenticationError("No authentication token provided");
    }

    // Verify and decode
    const payload = verifyAccessToken(token);

    // Attach user to request
    req.user = payload;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to authorize based on user roles
 * Usage: authorize('ADMIN', 'VENDOR')
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthorizationError("Authentication required");
      }

      // Check if user's role is in the allowed list
      const hasAccess = allowedRoles.includes(req.user.role);

      if (!hasAccess) {
        throw new AuthorizationError(
          `Access denied. Required roles: ${allowedRoles.join(", ")}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
