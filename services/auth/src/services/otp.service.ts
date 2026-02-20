import { OTPPurpose } from "@prisma/client";
import Database from "../config/database";
import { generateOTP, hashOTP, verifyOTP } from "../utils/crypto";
import { ValidationError } from "../utils/errors";
import config from "../config";
import logger from "../utils/logger";
import { RepositoryFactory } from "../repositories";

class OTPService {
  private prisma = Database.getInstance();
  private repositories = RepositoryFactory.getInstance(this.prisma);
  private otpRepository = this.repositories.otpRepository;

  /**
   * Generate email verification OTP
   */
  async generateEmailVerificationOTP(userId: string): Promise<string> {
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(
      Date.now() + config.otp.expiryMinutes * 60 * 1000,
    );

    // Invalidate previous OTPs
    await this.otpRepository.invalidateUserOTPs(
      userId,
      OTPPurpose.EMAIL_VERIFICATION,
    );

    // Create new OTP
    await this.otpRepository.create({
      user: { connect: { id: userId } },
      otpHash,
      purpose: OTPPurpose.EMAIL_VERIFICATION,
      expiresAt,
    });

    logger.info(`Email verification OTP generated for user: ${userId}`);
    return otp;
  }

  /**
   * Verify email verification OTP
   */
  async findValidOTPs(
    userId: string,
    otp: string,
    purpose: OTPPurpose,
  ): Promise<string> {
    // Get non-consumed, non-expired OTPs
    const otpToken = await this.otpRepository.findValidOTPByPurpose(
      userId,
      purpose,
    );

    if (!otpToken) {
      throw new ValidationError("No valid OTP found for this user");
    }

    const isValid = await verifyOTP(otp, otpToken.otpHash);
    if (isValid) {
      await this.otpRepository.markAsUsed(otpToken.id);
      return otpToken.userId;
    }

    throw new ValidationError("Invalid OTP");
  }

  /**
   * Generate password reset OTP
   */
  async generatePasswordResetOTP(userId: string): Promise<string> {
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(
      Date.now() + config.otp.expiryMinutes * 60 * 1000,
    );

    // Invalidate previous OTPs
    await this.otpRepository.invalidateUserOTPs(
      userId,
      OTPPurpose.PASSWORD_RESET,
    );

    // Create new OTP
    await this.otpRepository.create({
      user: { connect: { id: userId } },
      otpHash,
      purpose: OTPPurpose.PASSWORD_RESET,
      expiresAt,
    });

    logger.info(`Password reset OTP generated for user: ${userId}`);
    return otp;
  }

  /**
   * Verify password reset OTP
   */
  async verifyPasswordResetOTP(userId: string, otp: string): Promise<string> {
    // Get all non-consumed, non-expired OTPs
    console.log("Finding valid OTPs for user:", { userId, otp });
    const otpToken = await this.otpRepository.findValidOTPByPurpose(
      userId,
      OTPPurpose.PASSWORD_RESET,
    );

    if (!otpToken) {
      throw new ValidationError("Invalid or expired OTP");
    }

    // Try to match OTP

    const isValid = await verifyOTP(otp, otpToken.otpHash);
    console.log("OTP verification result:", {
      otp,
      tokenId: otpToken.id,
      isValid,
    });
    if (isValid) {
      // Mark as consumed
      await this.otpRepository.markAsUsed(otpToken.id);

      logger.info(`Password reset OTP verified for user: ${otpToken.userId}`);
      return otpToken.userId;
    }

    throw new ValidationError("Invalid or expired OTP");
  }

  /**
   * Clean up expired OTPs (should be run periodically)
   */
  async cleanupExpiredOTPs(): Promise<number> {
    const expiredResult = await this.otpRepository.deleteExpired();
    const usedResult = await this.otpRepository.deleteOldUsedOTPs(7);
    const totalCount = expiredResult.count + usedResult.count;

    logger.info(`Cleaned up ${totalCount} expired/consumed OTPs`);
    return totalCount;
  }
}

export default new OTPService();
