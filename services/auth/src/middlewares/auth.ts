import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JWTPayload } from "../utils/jwt";
import { AuthenticationError, AuthorizationError } from "../utils/errors";
import { UserRole } from "@prisma/client";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

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
 * Usage: authorize(UserRole.ADMIN, UserRole.VENDOR)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthorizationError("Authentication required");
      }

      // Check if user's role is in the allowed list
      const hasAccess = allowedRoles.includes(req.user.role as UserRole);

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

/**
 *
 * Check if user has specified role
 */
export const hasRole = (role: UserRole) => {
  return (req: Request, _resw: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError("Authentication required");
      }
      const userRole = req.user.role as UserRole;
      if (userRole !== role) {
        throw new AuthorizationError(`Access denied. Required role: ${role}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = (
  req: Request,

  next: NextFunction
) => {
  try {
    // Get token from cookie first, then fall back to Authorization header
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const payload = verifyAccessToken(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};
