import dotenv from "dotenv";

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    resetSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  bcrypt: {
    saltRounds: number;
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  otp: {
    expiryMinutes: number;
    length: number;
  };
  cookie: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "strict" | "lax" | "none";
    maxAge: number;
  };
  resend: {
    RESEND_API_KEY: string;
  };
}

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

const config: Config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: requireEnv("DATABASE_URL"),
  jwt: {
    accessSecret: requireEnv("JWT_ACCESS_SECRET"),
    refreshSecret: requireEnv("JWT_REFRESH_SECRET"),
    resetSecret: requireEnv("JWT_RESET_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "30m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10),
  },
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: process.env.EMAIL_SECURE === "true",
    user: requireEnv("EMAIL_USER"),
    password: requireEnv("EMAIL_PASSWORD"),
    from: process.env.EMAIL_FROM || "noreply@booking.com",
  },
  resend: {
    RESEND_API_KEY: requireEnv("RESEND_API_KEY"),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  },
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || "15", 10),
    length: parseInt(process.env.OTP_LENGTH || "6", 10),
  },
  cookie: {
    httpOnly: true,
    // Ensure this is TRUE in production
    secure:
      process.env.NODE_ENV === "production" ||
      process.env.COOKIE_SECURE === "true",
    sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as
      | "strict"
      | "lax"
      | "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

export default config;
