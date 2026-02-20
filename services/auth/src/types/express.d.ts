import { JWTPayload } from "../utils/jwt";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export {}; // makes this a module, required for augmentation to work
