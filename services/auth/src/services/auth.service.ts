import { User, UserRole, UserStatus } from "@prisma/client";
import Database from "../config/database";
import { hashPassword, comparePassword } from "../utils/crypto";
import {
  generateTokenPair,
  verifyRefreshToken,
  JWTPayload,
} from "../utils/jwt";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  TokenExpiredError,
  ValidationError,
} from "../utils/errors";
import {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ResendOTPInput,
} from "../utils/validators";
import otpService from "./otp.service";
import emailService from "./email.service";
import logger from "../utils/logger";
import { RepositoryFactory } from "../repositories";

class AuthService {
  private prisma = Database.getInstance(); // The Singleton Retrieval
  private repositories = RepositoryFactory.getInstance(this.prisma);
  private userRepository = this.repositories.userRepository;
  private refreshTokenRepository = this.repositories.refreshTokenRepository;

  /**
   * Register a new user
   */
  async register(
    input: RegisterInput
  ): Promise<{ user: Partial<User>; message: string }> {
    const { email, username, password, role } = input;

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmailOrUsername(email);
    const existingUsername = await this.userRepository.findByUsername(username);

    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    if (existingUsername) {
      throw new ConflictError("Username already taken");
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await this.userRepository.create({
      email,
      username,
      passwordHash,
      role: (role as UserRole) || UserRole.CUSTOMER,
      status: UserStatus.PENDING_VERIFICATION,
      isEmailVerified: false,
    });

    // Generate and send OTP
    const otp = await otpService.generateEmailVerificationOTP(user.id);
    await emailService.sendVerificationEmail(email, otp);

    logger.info(`User registered: ${user.id} (${email})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
      },
      message:
        "Registration successful. Please check your email for verification code.",
    };
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(input: VerifyEmailInput): Promise<{ message: string }> {
    const { email, token } = input;

    // Verify OTP and get userId
    const userId = await otpService.verifyEmailVerificationOTP(token);

    // Get user and validate email matches
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify email matches the OTP owner
    if (user.email !== email) {
      throw new AuthenticationError(
        "Email does not match the verification token"
      );
    }

    // Update user
    await this.userRepository.markEmailAsVerified(userId);

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.username);

    logger.info(`Email verified for user: ${userId}`);

    return {
      message: "Email verified successfully. You can now log in.",
    };
  }

  /**
   * Resend OTP for email verification
   */
  async resendEmailVerificationOTP(
    input: ResendOTPInput
  ): Promise<{ message: string }> {
    const { email } = input;

    // Find user
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if already verified
    if (user.isEmailVerified) {
      throw new ConflictError("Email is already verified");
    }

    // Check if user is not deleted or suspended
    if (
      user.status === UserStatus.DELETED ||
      user.status === UserStatus.SUSPENDED
    ) {
      throw new AuthenticationError("Account is not active");
    }

    // Generate and send new OTP
    const otp = await otpService.generateEmailVerificationOTP(user.id);
    await emailService.sendVerificationEmail(email, otp);

    logger.info(`Verification OTP resent to: ${email}`);

    return {
      message: "Verification code has been resent to your email.",
    };
  }
  /**
   * Login user
   */
  async login(input: LoginInput): Promise<{
    user: Partial<User>;
    accessToken: string;
    refreshToken: string;
  }> {
    const { email, password } = input;

    // Find user
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AuthenticationError("Invalid email or password");
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid email or password");
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      const otp = await otpService.generateEmailVerificationOTP(user.id);
      await emailService.sendVerificationEmail(email, otp);
      throw new AuthenticationError(
        "Email not verified. A new verification code has been sent to your email."
      );
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError(`Account is ${user.status.toLowerCase()}`);
    }

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } = generateTokenPair(payload);

    // Store refresh token
    await this.refreshTokenRepository.create({
      user: { connect: { id: user.id } },
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    logger.info(`User logged in: ${user.id} (${email})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(oldRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Verify refresh token
    const payload = verifyRefreshToken(oldRefreshToken);

    // Check if token exists and is not revoked
    const tokenRecord = await this.refreshTokenRepository.findValidToken(
      oldRefreshToken,
      payload.userId
    );

    if (!tokenRecord) {
      throw new TokenExpiredError(
        "Refresh token is invalid or has been revoked"
      );
    }

    // Get user
    const user = await this.userRepository.findById(payload.userId);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError("User not found or inactive");
    }

    // Generate new tokens
    const newPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } = generateTokenPair(newPayload);

    // Revoke old token and store new one
    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revokedAt: new Date() },
      });
      await tx.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    });

    logger.info(`Token refreshed for user: ${user.id}`);

    return { accessToken, refreshToken };
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    // Revoke refresh token
    await this.refreshTokenRepository.revokeByToken(refreshToken);

    return { message: "Logged out successfully" };
  }

  /**
   * Forgot password - send OTP
   */
  async forgotPassword(
    input: ForgotPasswordInput
  ): Promise<{ message: string }> {
    const { email } = input;

    const user = await this.userRepository.findByEmail(email);

    // Don't reveal if email exists or not
    if (!user) {
      return {
        message: "If the email exists, a password reset code has been sent.",
      };
    }

    // Generate and send OTP
    const otp = await otpService.generatePasswordResetOTP(user.id);
    await emailService.sendPasswordResetEmail(email, otp);

    logger.info(`Password reset OTP sent to: ${email}`);

    return {
      message: "If the email exists, a password reset code has been sent.",
    };
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const { token, newPassword, confirmNewPassword }: ResetPasswordInput =
      input;

    // Check password match
    if (newPassword !== confirmNewPassword) {
      throw new ValidationError("New password and confirmation do not match");
    }
    // Verify OTP
    const userId = await otpService.verifyPasswordResetOTP(token);

    // Get user to compare with old password
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isSamePassword = await comparePassword(
      newPassword,
      user.passwordHash
    );

    if (isSamePassword) {
      throw new ConflictError(
        "New password cannot be the same as the old password"
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await this.userRepository.updatePassword(userId, passwordHash);

    // Revoke all refresh tokens for security
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    logger.info(`Password reset successful for user: ${userId}`);

    return {
      message:
        "Password reset successfully. Please log in with your new password.",
    };
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}

export default new AuthService();
