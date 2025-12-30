import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import config from "./config";
import Database from "./config/database";
import logger from "./utils/logger";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS
    this.app.use(
      cors({
        origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
        credentials: true,
      })
    );

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Cookie parsing
    this.app.use(cookieParser());

    // Request logging
    if (config.nodeEnv === "development") {
      this.app.use(morgan("dev"));
    } else {
      this.app.use(
        morgan("combined", {
          stream: {
            write: (message: string) => logger.info(message.trim()),
          },
        })
      );
    }

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use("/api/", limiter);

    // Strict rate limiting for auth endpoints
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 requests per window
      message: "Too many authentication attempts, please try again later.",
    });
    this.app.use("/api/auth/login", authLimiter);
    this.app.use("/api/auth/register", authLimiter);
    this.app.use("/api/auth/forgot-password", authLimiter);
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get("/health", async (_req: Request, res: Response) => {
      const dbHealthy = await Database.healthCheck();

      res.status(dbHealthy ? 200 : 503).json({
        status: dbHealthy ? "healthy" : "unhealthy",
        service: "auth-service",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbHealthy ? "connected" : "disconnected",
      });
    });

    // API routes
    this.app.use("/api", routes);

    // Root
    this.app.get("/", (res: Response) => {
      res.json({
        message: "Auth Service API",
        version: "1.0.0",
        docs: "/api/docs",
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await Database.connect();

      // Start server
      this.app.listen(config.port, () => {
        logger.info(`🚀 Auth service running on port ${config.port}`);
        logger.info(`📝 Environment: ${config.nodeEnv}`);
        logger.info(`🔗 Health check: http://localhost:${config.port}/health`);
      });
    } catch (error) {
      logger.error("Failed to start server:", error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    await Database.disconnect();
    logger.info("Server stopped");
  }
}

// Create and start app
const app = new App();
app.start();

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  await app.stop();
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled rejections
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

export default app;
