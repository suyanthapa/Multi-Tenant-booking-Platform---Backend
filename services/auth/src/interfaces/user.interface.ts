import { UserRole } from "@prisma/client";
import { UserStatus } from "../generated/prisma/client";

export interface GetUsersQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedUsers {
  data: UserResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
