import winston from "winston";
import config from "../config";
import DailyRotateFile from "winston-daily-rotate-file";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: config.nodeEnv === "production" ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "auth-service" },
  transports: [
    // Rotate logs daily
    new DailyRotateFile({
      filename: "logs/application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
    }),

    // Error-only file
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
  ],
});

// Console in development
if (config.nodeEnv !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

export default logger;
