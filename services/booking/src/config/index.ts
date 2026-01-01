import dotenv from "dotenv";

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwt: {
    accessSecret: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  cookie: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "strict" | "lax" | "none";
    maxAge: number;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || "4001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET ||
      "your-access-secret-key-change-in-production",
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  },
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
      (process.env.COOKIE_SAME_SITE as "strict" | "lax" | "none") || "strict",
    maxAge: parseInt(process.env.COOKIE_MAX_AGE || "604800000", 10), // 7 days
  },
};

export default config;
