import { User, UserRole, UserStatus } from "@prisma/client";
import Database from "../config/database";
import { hashPassword, comparePassword } from "../utils/crypto";
import {
  generateTokenPair,
  verifyRefreshToken,
  JWTPayload,
} from "../utils/jwt";
import {
  AccountPendingError,
  AccountSuspendedError,
  AuthenticationError,
  ConflictError,
  EmailNotVerifiedError,
  InternalServerError,
  NotFoundError,
  TokenExpiredError,
  ValidationError,
} from "../utils/errors";

import otpService from "./otp.service";
import emailService from "./email.service";
import logger from "../utils/logger";
import { RepositoryFactory } from "../repositories";
import { PaginatedUsers, UserResponse } from "../interfaces/user.interface";
import { sanitizeUser } from "../utils/sanitizer";
import businessClient from "../clients/businessClient";
import jwt from "jsonwebtoken";
import {
  ForgotPasswordInput,
  LoginInput,
  RegisterBusinessInput,
  RegisterInput,
  ResendOTPInput,
  ResetPasswordInput,
  VerifyEmailInput,
  VerifyOtpInput,
} from "../types/auth.types";
import { EditUserDto, GetAllUsersInput } from "../types/user.types";
import { OTPPurpose } from "../generated/prisma/enums";
import config from "../config";

class AuthService {
  private prisma = Database.getInstance(); // The Singleton Retrieval
  private repositories = RepositoryFactory.getInstance(this.prisma);
  private userRepository = this.repositories.userRepository;
  private refreshTokenRepository = this.repositories.refreshTokenRepository;

  /**
   * Register a new user
   */
  async register(
    input: RegisterInput,
  ): Promise<{ user: Partial<User>; message: string }> {
    const { email, username, password } = input;

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
      role: UserRole.CUSTOMER,
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

  // register a business
  async registerBusiness(input: RegisterBusinessInput): Promise<void> {
    // check if email already exists
    const existingUser = await this.userRepository.findByEmailOrUsername(
      input.email,
    );
    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user with VENDOR role
    const user = await this.userRepository.create({
      email: input.email,
      username:
        `${input.firstName} ${input.lastName}` || input.email.split("@")[0],
      passwordHash,
      role: UserRole.VENDOR,
      status: UserStatus.PENDING_VERIFICATION,
      isEmailVerified: false,
    });

    const business = await businessClient.createBusiness({
      ownerId: user.id,
      name: input.businessName,
      description: input.businessDescription,
      type: input.businessType,
      address: input.businessAddress,
      phone: input.businessPhone,
      email: input.email,
    });

    if (!business) {
      throw new InternalServerError("Failed to create business");
    }

    console.log("Business created:", business);
    // Generate and send OTP
    const otp = await otpService.generateEmailVerificationOTP(user.id);
    await emailService.sendVerificationEmail(input.email, otp);

    logger.info(`Business registered: ${user.id} (${input.email})`);
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(input: VerifyEmailInput): Promise<{ message: string }> {
    const { email, otp, purpose } = input;

    // Get user by email
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify OTP and get userId
    const userId = await otpService.findValidOTPs(user.id, otp, purpose);

    // Update user
    await this.userRepository.markEmailAsVerified(userId);

    // Mark Business Email Verified
    await businessClient.markBusinessEmailVerified(user.id, email);

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.username);

    logger.info(`Email verified for user: ${userId}`);

    return {
      message: "Email verified successfully. You can now log in.",
    };
  }

  /**
   * Verify OTP (standalone verification endpoint)
   */
  async verifyOtp(
    input: VerifyOtpInput,
  ): Promise<{ message: string; user: UserResponse; resetToken?: string }> {
    const { email, otp } = input;

    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new NotFoundError("User not found");

    const verifiedUserId = await otpService.findValidOTPs(
      user.id,
      otp,
      OTPPurpose.EMAIL_VERIFICATION,
    );
    if (!verifiedUserId) {
      throw new NotFoundError("Invalid verification code");
    }

    // Verify email matches the OTP owner
    if (user.email !== email) {
      throw new AuthenticationError(
        "Email does not match the verification token",
      );
    }

    // Update user
    await this.userRepository.markEmailAsVerified(user.id);

    // Send welcome email
    // await emailService.sendWelcomeEmail(user.email, user.username);

    // 3. Generate a temporary Reset Token (valid for 10-15 minutes)
    const resetToken = jwt.sign(
      {
        userId: user.id,
        purpose: "PASSWORD_RESET",
      },
      config.jwt.accessExpiresIn,
      { expiresIn: "15m" },
    );
    logger.info(`OTP verified successfully for user: ${user.id}`);

    return {
      message: "OTP verified successfully. Email confirmed.",
      user: sanitizeUser(user),
      resetToken: resetToken,
    };
  }

  /**
   * Resend OTP for email verification
   */
  async resendEmailVerificationOTP(
    input: ResendOTPInput,
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
      throw new EmailNotVerifiedError(
        "Email not verified. A new verification code has been sent to your email.",
      );
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError(`Account is ${user.status.toLowerCase()}`);
    }
    const business = await businessClient.validateBusinessByOwner(user.id);

    if (business.status === "PENDING") {
      throw new AccountPendingError(
        "Your business account is pending admin approval.",
      );
    }

    if (business.status === "SUSPENDED") {
      throw new AccountSuspendedError(
        "Your business account has been suspended. Please contact support.",
      );
    }

    // Generate tokens
    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      ...(business && { businessId: business.businessId }),
    };

    console.log("Business Info:", business);
    console.log("JWT Payload:", payload);
    const { accessToken, refreshToken } = generateTokenPair(payload);

    // Store refresh token
    await this.refreshTokenRepository.create({
      user: { connect: { id: user.id } },
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 60 * 60 * 1000),
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
      payload.id,
    );

    if (!tokenRecord) {
      throw new TokenExpiredError(
        "Refresh token is invalid or has been revoked",
      );
    }

    // Get user
    const user = await this.userRepository.findById(payload.id);

    const business = await businessClient.validateBusinessByOwner(
      user?.id || "",
    );

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError("User not found or inactive");
    }

    // Generate new tokens
    const newPayload: JWTPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      ...(business && { businessId: business.businessId }),
    };

    const { accessToken, refreshToken } = generateTokenPair(newPayload);

    await this.userRepository.rotateToken(
      tokenRecord.id,
      user.id,
      refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );

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
    input: ForgotPasswordInput,
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
    const {
      email,
      resetToken,
      newPassword,
      confirmNewPassword,
    }: ResetPasswordInput = input;

    // Check password match
    if (newPassword !== confirmNewPassword) {
      throw new ValidationError("New password and confirmation do not match");
    }

    const decoded = jwt.verify(resetToken, config.jwt.resetSecret) as {
      userId: string;
      purpose: string;
    };

    if (decoded.purpose !== "PASSWORD_RESET") {
      throw new AuthenticationError("Invalid token purpose");
    }

    // Get user to compare with old password
    const user = await this.userRepository.findByEmail(email);
    console.log("User found for password reset:", user);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isSamePassword = await comparePassword(
      newPassword,
      user.passwordHash,
    );
    console.log("Is new password same as old?", isSamePassword);
    if (isSamePassword) {
      throw new ConflictError(
        "New password cannot be the same as the old password",
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);
    console.log("Password hash generated for reset:", passwordHash);
    // Update password
    await this.userRepository.updatePassword(decoded.userId, passwordHash);
    console.log("Password updated for user:", decoded.userId);
    // Revoke all refresh tokens for security
    await this.prisma.refreshToken.updateMany({
      where: { userId: decoded.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    logger.info(`Password reset successful for user: ${decoded.userId}`);
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

  //get all users
  async getAllUsers(input: GetAllUsersInput): Promise<PaginatedUsers> {
    const { page = 1, limit = 10, status, role } = input;

    const result = await this.userRepository.findWithPagination({
      page,
      limit,
      status,
      role,
    });

    return {
      data: result.users,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  //edit user
  async editUser(
    userId: string,
    updateData: EditUserDto,
  ): Promise<UserResponse> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Update user
    const updatedUser = await this.userRepository.update(userId, updateData);

    return sanitizeUser(updatedUser);
  }

  //delete user
  async deleteUser(userId: string): Promise<void> {
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Delete user
    await this.userRepository.delete(userId);
  }

  //validate user
  async validateUser(userId: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }
    return sanitizeUser(user);
  }
}

export default new AuthService();
