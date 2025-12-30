import { PrismaClient, OTPToken, OTPPurpose, Prisma } from "@prisma/client";

/**
 * OTP Token Repository
 * Handles all database operations related to OTP tokens
 */
export class OTPRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Find OTP token by ID
   */
  async findById(id: string): Promise<OTPToken | null> {
    return this.prisma.oTPToken.findUnique({
      where: { id },
    });
  }

  /**
   * Find latest valid OTP for user and purpose
   */
  async findLatestValidOTP(
    userId: string,
    purpose: OTPPurpose
  ): Promise<OTPToken | null> {
    return this.prisma.oTPToken.findFirst({
      where: {
        userId,
        purpose,
        expiresAt: {
          gt: new Date(),
        },
        consumedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find all valid OTPs by purpose (non-consumed, non-expired)
   */
  async findValidOTPsByPurpose(purpose: OTPPurpose): Promise<OTPToken[]> {
    return this.prisma.oTPToken.findMany({
      where: {
        purpose,
        consumedAt: null,
        expiresAt: { gte: new Date() },
      },
    });
  }

  /**
   * Find all OTPs for a user
   */
  async findByUserId(userId: string): Promise<OTPToken[]> {
    return this.prisma.oTPToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find OTPs by purpose
   */
  async findByPurpose(purpose: OTPPurpose): Promise<OTPToken[]> {
    return this.prisma.oTPToken.findMany({
      where: { purpose },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create new OTP token
   */
  async create(data: Prisma.OTPTokenCreateInput): Promise<OTPToken> {
    return this.prisma.oTPToken.create({
      data,
    });
  }

  /**
   * Mark OTP as used
   */
  async markAsUsed(id: string): Promise<OTPToken> {
    return this.prisma.oTPToken.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  /**
   * Delete OTP token
   */
  async delete(id: string): Promise<OTPToken> {
    return this.prisma.oTPToken.delete({
      where: { id },
    });
  }

  /**
   * Delete all OTPs for a user
   */
  async deleteByUserId(userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.oTPToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Delete expired OTPs
   */
  async deleteExpired(): Promise<Prisma.BatchPayload> {
    return this.prisma.oTPToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Delete used OTPs older than specified days
   */
  async deleteOldUsedOTPs(days: number = 7): Promise<Prisma.BatchPayload> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.prisma.oTPToken.deleteMany({
      where: {
        consumedAt: {
          not: null,
          lt: cutoffDate,
        },
      },
    });
  }

  /**
   * Invalidate all OTPs for a user and purpose
   */
  async invalidateUserOTPs(
    userId: string,
    purpose: OTPPurpose
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.oTPToken.updateMany({
      where: {
        userId,
        purpose,
        consumedAt: null,
      },
      data: { consumedAt: new Date() },
    });
  }

  /**
   * Count OTPs by user and purpose
   */
  async countByUserAndPurpose(
    userId: string,
    purpose: OTPPurpose
  ): Promise<number> {
    return this.prisma.oTPToken.count({
      where: {
        userId,
        purpose,
        createdAt: {
          gt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });
  }

  /**
   * Check if user has exceeded OTP limit
   */
  async hasExceededLimit(
    userId: string,
    purpose: OTPPurpose,
    limit: number = 5
  ): Promise<boolean> {
    const count = await this.countByUserAndPurpose(userId, purpose);
    return count >= limit;
  }
}
