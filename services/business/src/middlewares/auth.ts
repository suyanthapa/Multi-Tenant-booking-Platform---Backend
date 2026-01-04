import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticationError, AuthorizationError } from "../utils/errors";
import config from "../config";

// JWT Payload interface
export interface JWTPayload {
  id: string;
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
 * Professional Microservice Authenticate (Header-Based)
 * Used in: Business Service, Resource Service, Booking Service
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // 1. Read headers injected by the Gateway
    const id = req.headers["x-user-id"] as string;
    const email = req.headers["x-user-email"] as string;
    const role = req.headers["x-user-role"] as string;

    console.log("Auth Middleware - User ID:", id);
    console.log("Auth Middleware - User Email:", email);
    console.log("Auth Middleware - User Role:", role);
    // 2. If Gateway didn't send these, someone bypassed the Gateway!
    if (!id || !role) {
      throw new AuthenticationError(
        "Internal Security Breach: No Identity Headers"
      );
    }

    // 3. Attach to request so req.user.id works in your controllers
    req.user = {
      id,
      email,
      role,
    };

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
