import { Router } from "express";
import authController from "../controllers/auth.controller";
import { validate } from "../middlewares/validator";
import { authenticate, authorize } from "../middlewares/auth";
import { UserRole } from "@prisma/client";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  resendVerificationOTPSchema,
  editUserSchema,
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

/**
 * @route  GET /auth/users
 * @desc   Get all users (Admin only)
 * @access Private
 */
router.get(
  "/users",
  authenticate,
  authorize(UserRole.ADMIN),
  authController.getAllUsers
);

/**
 * @route  PATCH /auth/users/:userId
 * @desc   Edit user (Admin only)
 * @access Private
 */
router.patch(
  "/users/:userId",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(editUserSchema),
  authController.editUser
);

/**
 * @route DELETE /auth/users/:userId
 * @desc  Delete user (Admin only)
 * @access Private
 */
router.delete(
  "/users/:userId",
  authenticate,
  authorize(UserRole.ADMIN),
  authController.deleteUser
);

export default router;
