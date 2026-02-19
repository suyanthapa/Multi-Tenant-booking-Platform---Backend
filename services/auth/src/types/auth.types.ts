import { z } from "zod";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerBusinessSchema,
  registerSchema,
  resendOTPSchema,
  resendVerificationOTPSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyOtpSchema,
} from "../dtos/auth.dto";

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type RegisterBusinessInput = z.infer<
  typeof registerBusinessSchema
>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>["body"];
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
export type ResendOTPInput = z.infer<typeof resendOTPSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>["body"];
export type ResendVerificationOTPInput = z.infer<
  typeof resendVerificationOTPSchema
>["body"];
