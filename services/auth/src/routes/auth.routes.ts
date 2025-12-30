import { Router } from "express";
import authController from "../controllers/auth.controller";
import { validate } from "../middlewares/validator";
import { authenticate } from "../middlewares/auth";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  resendVerificationOTPSchema,
} from "../utils/validators";

const router = Router();

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", validate(registerSchema), authController.register);

/**
 * @route   POST /auth/verify-email
 * @desc    Verify email with OTP
 * @access  Public
 */
router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  authController.verifyEmail
);

/**
 * @route   POST /auth/resend-verification
 * @desc    Resend email verification OTP
 * @access  Public
 */

router.post(
  "/resend-verification",
  validate(resendVerificationOTPSchema),
  authController.resendVerificationOTP
);

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", validate(loginSchema), authController.login);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post("/logout", authController.logout);

/**
 * @route   POST /auth/forgot-password
 * @desc    Request password reset OTP
 * @access  Public
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @route   POST /auth/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticate, authController.getProfile);

export default router;
