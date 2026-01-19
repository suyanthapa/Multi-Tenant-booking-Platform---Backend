import jwt, { SignOptions } from "jsonwebtoken";
import config from "../config";
import { InvalidTokenError, TokenExpiredError } from "./errors";

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  businessId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as SignOptions);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as SignOptions);
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (payload: JWTPayload): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as JWTPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new TokenExpiredError("Access token has expired");
    }
    throw new InvalidTokenError("Invalid access token");
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as JWTPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new TokenExpiredError("Refresh token has expired");
    }
    throw new InvalidTokenError("Invalid refresh token");
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};
