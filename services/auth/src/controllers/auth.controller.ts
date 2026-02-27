import { Request, Response } from "express";
import authService from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import config from "../config";

import { UserRole, UserStatus } from "@prisma/client";
import {
  ForgotPasswordInput,
  LoginInput,
  RegisterBusinessInput,
  RegisterInput,
  ResendVerificationOTPInput,
  ResetPasswordInput,
  VerifyEmailInput,
  VerifyOtpInput,
} from "../types/auth.types";
import { successResponse, errorResponse } from "../utils/response";

class AuthController {
  /**
   * Register a new user
   * POST /auth/register
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const input: RegisterInput = req.body;
    const result = await authService.register(input);

    successResponse(
      res,
      result,
      "Registration successful. Please verify your email to activate your account.",
      201,
    );
  });

  //register a business
  registerBusiness = asyncHandler(async (req: Request, res: Response) => {
    const input: RegisterBusinessInput = req.body;

    const result = await authService.registerBusiness(input);

    return successResponse(
      res,
      result,
      "Business registration successful. Please verify your email to activate your account.",
      201,
    );
  });

  /**
   * Verify email with OTP
   * POST /auth/verify-email
   */
  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const input: VerifyEmailInput = req.body;
    const result = await authService.verifyEmail(input);

    return successResponse(res, result, "Email verified successfully", 201);
  });

  /**
   * Verify OTP
   * POST /auth/verify-otp
   */
  verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const input: VerifyOtpInput = req.body;
    const result = await authService.verifyOtp(input);

    return successResponse(
      res,
      { resetToken: result.resetToken },
      result.message,
    );
  });

  /**
   * Resend email verification OTP
   * POST /auth/resend-verification
   */

  resendVerificationOTP = asyncHandler(async (req: Request, res: Response) => {
    const { email }: ResendVerificationOTPInput = req.body;
    const result = await authService.resendEmailVerificationOTP({ email });

    return successResponse(res, null, result.message);
  });

  /**
   * Login user
   * POST /auth/login
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const input: LoginInput = req.body;
    const result = await authService.login(input);

    // Set tokens in HTTP-only cookies
    res.cookie("accessToken", result.accessToken, {
      httpOnly: config.cookie.httpOnly,
      secure: true,
      sameSite: "none",
      maxAge: 20 * 60 * 1000, // 20 minutes
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: config.cookie.maxAge,
    });

    return successResponse(res, { user: result.user }, "Login successful");
  });

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return errorResponse(
        res,
        "Refresh token is required",
        400,
        "MISSING_TOKEN",
      );
    }

    const result = await authService.refreshToken(refreshToken);

    // Set new tokens in cookies
    res.cookie("accessToken", result.accessToken, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: config.cookie.maxAge,
    });

    return successResponse(res, null, "Token refreshed successfully");
  });

  /**
   * Logout user
   * POST /auth/logout
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // Clear cookies
    res.clearCookie("accessToken", {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
    });

    res.clearCookie("refreshToken", {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
    });

    return successResponse(res, null, "Logout successful");
  });

  /**
   * Forgot password - send OTP
   * POST /auth/forgot-password
   */
  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const input: ForgotPasswordInput = req.body;
    const result = await authService.forgotPassword(input);

    return successResponse(res, null, result.message);
  });

  /**
   * Reset password with OTP
   * POST /auth/reset-password
   */
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const input: ResetPasswordInput = req.body;
    const result = await authService.resetPassword(input);

    return successResponse(res, null, result.message);
  });

  /**
   * Get current user profile
   * GET /auth/me
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await authService.getProfile(userId);

    return successResponse(res, result);
  });

  /**
   * Get all users (Admin only)
   */
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, role, status } = req.query;

    const result = await authService.getAllUsers({
      page: Number(page),
      limit: Number(limit),
      role: role as UserRole,
      status: status as UserStatus,
    });

    return successResponse(res, result);
  });

  /**
   * Edit User (Admin only)
   * PATCH /users/:userId
   */

  editUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const updateData = req.body;

    const result = await authService.editUser(userId, updateData);

    return successResponse(res, result);
  });

  /**
   * Delete User (Admin only)
   * DELETE /users/:userId
   */

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    await authService.deleteUser(userId);

    return successResponse(res, null, "User deleted successfully");
  });
}

export default new AuthController();
