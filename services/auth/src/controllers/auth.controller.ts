import { Request, Response } from "express";
import authService from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  RefreshTokenInput,
} from "../utils/validators";

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
   * Login user
   * POST /auth/login
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const input: LoginInput = req.body;
    const result = await authService.login(input);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const input: RefreshTokenInput = req.body;
    const result = await authService.refreshToken(input.refreshToken);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Logout user
   * POST /auth/logout
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.logout(refreshToken);

    res.status(200).json({
      success: true,
      data: result,
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
    const userId = req.user!.userId;
    const result = await authService.getProfile(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });
}

export default new AuthController();
