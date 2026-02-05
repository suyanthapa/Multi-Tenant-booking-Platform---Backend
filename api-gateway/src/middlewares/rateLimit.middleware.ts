import rateLimit from "express-rate-limit";

// General API rate limiter - applies to most endpoints
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many requests",
      message: "You have exceeded the rate limit. Please try again later.",
    });
  },
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    error:
      "Too many authentication attempts from this IP, please try again after 15 minutes.",
  },
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many login attempts",
      message:
        "Account temporarily locked due to multiple failed login attempts. Please try again later.",
    });
  },
});

// Rate limiter for registration/signup
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 signup attempts per hour
  message: {
    success: false,
    error: "Too many accounts created from this IP, please try again later.",
  },
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: "Registration limit exceeded",
      message: "Too many registration attempts. Please try again later.",
    });
  },
});

// Rate limiter for password reset/forgot password
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error:
      "Too many password reset attempts from this IP, please try again later.",
  },
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: "Password reset limit exceeded",
      message:
        "Too many password reset attempts. Please try again after an hour.",
    });
  },
});

// Rate limiter for OTP/verification endpoints
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 OTP requests per hour
  message: {
    success: false,
    error: "Too many OTP requests from this IP, please try again later.",
  },
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: "OTP request limit exceeded",
      message:
        "Too many OTP requests. Please wait before requesting another code.",
    });
  },
});

// Rate limiter for booking creation
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 40, // Limit each IP to 40 booking requests per hour
  message: {
    success: false,
    error: "Too many booking requests from this IP, please try again later.",
  },
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: "Booking limit exceeded",
      message:
        "You have made too many booking attempts. Please try again later.",
    });
  },
});

// Rate limiter for resource/business creation
export const creationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 create requests per hour
  message: {
    success: false,
    error: "Too many creation requests from this IP, please try again later.",
  },
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: "Creation limit exceeded",
      message: "Too many creation requests. Please slow down.",
    });
  },
});
