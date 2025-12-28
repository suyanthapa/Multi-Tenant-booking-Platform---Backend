import { OTPPurpose } from "@prisma/client";
import Database from "../config/database";
import { generateOTP, hashOTP, verifyOTP } from "../utils/crypto";
import { ValidationError } from "../utils/errors";
import config from "../config";
import logger from "../utils/logger";

class OTPService {
  private prisma = Database.getInstance();

  /**
   * Generate email verification OTP
   */
  async generateEmailVerificationOTP(userId: string): Promise<string> {
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(
      Date.now() + config.otp.expiryMinutes * 60 * 1000
    );

    // Invalidate previous OTPs
    await this.prisma.oTPToken.updateMany({
      where: {
        userId,
        purpose: OTPPurpose.EMAIL_VERIFICATION,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });

    // Create new OTP
    await this.prisma.oTPToken.create({
      data: {
        userId,
        otpHash,
        purpose: OTPPurpose.EMAIL_VERIFICATION,
        expiresAt,
      },
    });

    logger.info(`Email verification OTP generated for user: ${userId}`);
    return otp;
  }

  /**
   * Verify email verification OTP
   */
  async verifyEmailVerificationOTP(otp: string): Promise<string> {
    // Get all non-consumed, non-expired OTPs
    const otpTokens = await this.prisma.oTPToken.findMany({
      where: {
        purpose: OTPPurpose.EMAIL_VERIFICATION,
        consumedAt: null,
        expiresAt: { gte: new Date() },
      },
    });

    if (otpTokens.length === 0) {
      throw new ValidationError("Invalid or expired OTP");
    }

    // Try to match OTP
    for (const token of otpTokens) {
      const isValid = await verifyOTP(otp, token.otpHash);
      if (isValid) {
        // Mark as consumed
        await this.prisma.oTPToken.update({
          where: { id: token.id },
          data: { consumedAt: new Date() },
        });

        logger.info(
          `Email verification OTP verified for user: ${token.userId}`
        );
        return token.userId;
      }
    }

    throw new ValidationError("Invalid or expired OTP");
  }

  /**
   * Generate password reset OTP
   */
  async generatePasswordResetOTP(userId: string): Promise<string> {
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(
      Date.now() + config.otp.expiryMinutes * 60 * 1000
    );

    // Invalidate previous OTPs
    await this.prisma.oTPToken.updateMany({
      where: {
        userId,
        purpose: OTPPurpose.PASSWORD_RESET,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });

    // Create new OTP
    await this.prisma.oTPToken.create({
      data: {
        userId,
        otpHash,
        purpose: OTPPurpose.PASSWORD_RESET,
        expiresAt,
      },
    });

    logger.info(`Password reset OTP generated for user: ${userId}`);
    return otp;
  }

  /**
   * Verify password reset OTP
   */
  async verifyPasswordResetOTP(otp: string): Promise<string> {
    // Get all non-consumed, non-expired OTPs
    const otpTokens = await this.prisma.oTPToken.findMany({
      where: {
        purpose: OTPPurpose.PASSWORD_RESET,
        consumedAt: null,
        expiresAt: { gte: new Date() },
      },
    });

    if (otpTokens.length === 0) {
      throw new ValidationError("Invalid or expired OTP");
    }

    // Try to match OTP
    for (const token of otpTokens) {
      const isValid = await verifyOTP(otp, token.otpHash);
      if (isValid) {
        // Mark as consumed
        await this.prisma.oTPToken.update({
          where: { id: token.id },
          data: { consumedAt: new Date() },
        });

        logger.info(`Password reset OTP verified for user: ${token.userId}`);
        return token.userId;
      }
    }

    throw new ValidationError("Invalid or expired OTP");
  }

  /**
   * Clean up expired OTPs (should be run periodically)
   */
  async cleanupExpiredOTPs(): Promise<number> {
    const result = await this.prisma.oTPToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { consumedAt: { not: null } }],
      },
    });

    logger.info(`Cleaned up ${result.count} expired/consumed OTPs`);
    return result.count;
  }
}

export default new OTPService();
