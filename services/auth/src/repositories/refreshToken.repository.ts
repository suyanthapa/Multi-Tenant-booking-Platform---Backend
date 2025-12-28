import { PrismaClient, RefreshToken, Prisma } from "@prisma/client";

/**
 * Refresh Token Repository
 * Handles all database operations related to refresh tokens
 */
export class RefreshTokenRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find refresh token by ID
   */
  async findById(id: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  /**
   * Find refresh token by token string
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  /**
   * Find all refresh tokens for a user
   */
  async findByUserId(userId: string): Promise<RefreshToken[]> {
    return this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find valid (non-expired) refresh tokens for a user
   */
  async findValidByUserId(userId: string): Promise<RefreshToken[]> {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create new refresh token
   */
  async create(data: Prisma.RefreshTokenCreateInput): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  /**
   * Delete refresh token by ID
   */
  async delete(id: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.delete({
      where: { id },
    });
  }

  /**
   * Delete refresh token by token string
   */
  async deleteByToken(token: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.delete({
      where: { token },
    });
  }

  /**
   * Delete all refresh tokens for a user (logout from all devices)
   */
  async deleteByUserId(userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Delete expired refresh tokens
   */
  async deleteExpired(): Promise<Prisma.BatchPayload> {
    return this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Count refresh tokens for a user
   */
  async countByUserId(userId: string): Promise<number> {
    return this.prisma.refreshToken.count({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  /**
   * Check if token exists and is valid
   */
  async isValid(token: string): Promise<boolean> {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!tokenRecord) return false;
    if (tokenRecord.revokedAt) return false;

    return tokenRecord.expiresAt > new Date();
  }

  /**
   * Clean up old expired tokens (older than specified days)
   */
  async cleanupOldTokens(days: number = 30): Promise<Prisma.BatchPayload> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: cutoffDate,
        },
      },
    });
  }

  /**
   * Revoke all tokens except the current one
   */
  async revokeAllExcept(
    userId: string,
    currentToken: string
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: {
          not: currentToken,
        },
      },
    });
  }

  /**
   * Get token statistics for a user
   */
  async getTokenStats(userId: string): Promise<{
    total: number;
    active: number;
    expired: number;
  }> {
    const now = new Date();

    const [total, active] = await Promise.all([
      this.prisma.refreshToken.count({ where: { userId } }),
      this.prisma.refreshToken.count({
        where: {
          userId,
          expiresAt: { gt: now },
        },
      }),
    ]);

    return {
      total,
      active,
      expired: total - active,
    };
  }
}
