import { Router } from "express";
import authController from "../controllers/auth.controller";
import { validate } from "../middlewares/validator";
import { authenticate } from "../middlewares/auth";
import {
  forgotPasswordSchema,
  loginSchema,
  registerBusinessSchema,
  registerSchema,
  resendVerificationOTPSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyOtpSchema,
} from "../dtos/auth.dto";

const authRouter = Router();

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
authRouter.post("/register", validate(registerSchema), authController.register);

/**
 * @route   POST /auth/register-business
 * @desc    Register a new business user
 * @access  Public
 */
authRouter.post(
  "/register-business",
  validate(registerBusinessSchema),
  authController.registerBusiness,
);
/**
 * @route   POST /auth/verify-email
 * @desc    Verify email with OTP
 * @access  Public
 */
authRouter.post(
  "/verify-email",
  validate(verifyEmailSchema),
  authController.verifyEmail,
);

/**
 * @route   POST /auth/verify-otp
 * @desc    Verify OTP for email verification
 * @access  Public
 */
authRouter.post(
  "/verify-otp",
  validate(verifyOtpSchema),
  authController.verifyOtp,
);

/**
 * @route   POST /auth/resend-verification
 * @desc    Resend email verification OTP
 * @access  Public
 */

authRouter.post(
  "/resend-verification",
  validate(resendVerificationOTPSchema),
  authController.resendVerificationOTP,
);

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
authRouter.post("/login", validate(loginSchema), authController.login);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
authRouter.post(
  "/refresh",

  authController.refreshToken,
);

/**
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Public
 */
authRouter.post("/logout", authController.logout);

/**
 * @route   POST /auth/forgot-password
 * @desc    Request password reset OTP
 * @access  Public
 */
authRouter.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

/**
 * @route   POST /auth/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword,
);

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private
 */
authRouter.get("/me", authenticate, authController.getProfile);

export default authRouter;
