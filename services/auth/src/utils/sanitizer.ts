import { User } from "@prisma/client";
import { UserResponse } from "../interfaces/user.interface";

// src/utils/sanitizer.ts
export const sanitizeUser = (user: User): UserResponse => {
  const { passwordHash, ...safeUser } = user;
  return safeUser as UserResponse;
};
