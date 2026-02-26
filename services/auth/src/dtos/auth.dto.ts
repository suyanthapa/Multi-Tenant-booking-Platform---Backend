import { z } from "zod";

// Password Schema
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export enum BusinessType {
  HOTEL = "HOTEL",
  CLINIC = "CLINIC",
  SALON = "SALON",
  CO_WORKING = "CO_WORKING",
  OTHER = "OTHER",
}

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    password: passwordSchema,
  }),
});

export const registerBusinessSchema = z.object({
  body: z
    .object({
      // Owner Info
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      ownerName: z.string().optional(),
      email: z.string().email("Invalid email address"),
      password: passwordSchema,
      confirmPassword: z.string().min(1, "Please confirm your password"),

      // Business Info
      businessName: z.string().min(2, "Business name is required"),
      businessPhone: z.string().min(1, "Business phone is required"),

      businessDescription: z
        .string()
        .max(500, "Description must be under 500 characters"),
      businessType: z.nativeEnum(BusinessType),

      // Address
      businessAddress: z.object({
        street: z.string().min(1, "Street is required"),
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State is required"),
        postalCode: z.string().min(1, "Postal code is required"),
        country: z.string().min(1, "Country is required"),
      }),

      agreeToTerms: z.literal(true, {
        errorMap: () => ({ message: "You must agree to the terms" }),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"], // This ensures the error is attached to the confirmPassword field
    }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().min(1, "OTP is required"),
    purpose: z.enum(["EMAIL_VERIFICATION", "PASSWORD_RESET"]),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().min(1, "OTP is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

export const resendOTPSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z
    .object({
      resetToken: z.string().min(1, "Reset token is required"),
      newPassword: passwordSchema,
      confirmNewPassword: passwordSchema,
      email: z.string().email("Invalid email address"),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "Passwords do not match",
      path: ["confirmNewPassword"],
    }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

export const resendVerificationOTPSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});
