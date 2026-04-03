interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  rateLimit: {
    windowMs: number;
    max: number;
  };
  email: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
    secure: boolean;
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || "3003", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
  },
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    user: process.env.EMAIL_USER || "",
    password: process.env.EMAIL_PASSWORD || "",
    from: process.env.EMAIL_FROM || "noreply@slotex.com",
    secure: process.env.EMAIL_SECURE === "true",
  },
};

export default config;
