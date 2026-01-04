import { Request, Response } from "express";
import authService from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import config from "../config";
import {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ResendVerificationOTPInput,
} from "../utils/validators";

import { UserRole, UserStatus } from "../generated/prisma/enums";

class AuthController {
  /**
   * Register a new user
   * POST /auth/register
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const input: RegisterInput = req.body;
    const result = await authService.register(input);

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  /**
   * Verify email with OTP
   * POST /auth/verify-email
   */
  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const input: VerifyEmailInput = req.body;
    const result = await authService.verifyEmail(input);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Resend email verification OTP
   * POST /auth/resend-verification
   */

  resendVerificationOTP = asyncHandler(async (req: Request, res: Response) => {
    const { email }: ResendVerificationOTPInput = req.body;
    const result = await authService.resendEmailVerificationOTP({ email });

    res.status(200).json({
      success: true,
      data: result,
    });
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

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        message: "Login successful",
      },
    });
  });

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
      return;
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

    res.status(200).json({
      success: true,
      data: { message: "Token refreshed successfully" },
    });
  });

  /**
   * Logout user
   * POST /auth/logout
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

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

    res.status(200).json({
      success: true,
      data: { message: "Logout successful" },
    });
  });

  /**
   * Forgot password - send OTP
   * POST /auth/forgot-password
   */
  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const input: ForgotPasswordInput = req.body;
    const result = await authService.forgotPassword(input);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Reset password with OTP
   * POST /auth/reset-password
   */
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const input: ResetPasswordInput = req.body;
    const result = await authService.resetPassword(input);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get current user profile
   * GET /auth/me
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await authService.getProfile(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
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

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Edit User (Admin only)
   * PATCH /users/:userId
   */

  editUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const updateData = req.body;

    const result = await authService.editUser(userId, updateData);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Delete User (Admin only)
   * DELETE /users/:userId
   */

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    await authService.deleteUser(userId);

    res.status(200).json({
      success: true,
      data: { message: "User deleted successfully" },
    });
  });
}

export default new AuthController();
