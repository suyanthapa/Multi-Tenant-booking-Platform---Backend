import {
  PrismaClient,
  User,
  UserRole,
  UserStatus,
  Prisma,
} from "@prisma/client";

/**
 * Base Repository interface defining common CRUD operations
 */
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(where?: any): Promise<T[]>;
  create(data: any): Promise<T>;
  update(id: string, data: any): Promise<T>;
  delete(id: string): Promise<T>;
}

/**
 * User Repository
 * Handles all database operations related to users
 */
export class UserRepository implements IRepository<User> {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Find user by email or username
   */
  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });
  }

  /**
   * Find many users with filters
   */
  async findMany(where?: Prisma.UserWhereInput): Promise<User[]> {
    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find users by role
   */
  async findByRole(role: UserRole): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find users by status
   */
  async findByStatus(status: UserStatus): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create new user
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  /**
   * Update user by ID
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Update user email verification status
   */
  async markEmailAsVerified(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        isEmailVerified: true,
        status: UserStatus.ACTIVE,
      },
    });
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  /**
   * Update user status
   */
  async updateStatus(id: string, status: UserStatus): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Delete user by ID (soft delete by updating status)
   */
  async delete(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.DELETED },
    });
  }

  /**
   * Hard delete user (use with caution)
   */
  async hardDelete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Count users with filters
   */
  async count(where?: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });
    return count > 0;
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { username },
    });
    return count > 0;
  }

  /**
   * Find users with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    where?: Prisma.UserWhereInput
  ): Promise<{ users: User[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      pages: Math.ceil(total / limit),
    };
  }
}
