import express, { Application, Request, Response } from "express";
import "./config/cloudinary";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import config from "./config";
import Database from "./config/database";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import logger from "./utils/logger";

const app: Application = express();

// Middlewares
app.use(helmet()); // Security headers
// Only allow requests from the API Gateway (internal service communication)
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  }),
); // Restrict CORS to gateway only
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(morgan("combined")); // HTTP request logger

// Health check
app.get("/health", async (_req, res) => {
  const dbHealthy = await Database.healthCheck();
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? "healthy" : "unhealthy",
    service: "business-service",
    timestamp: new Date().toISOString(),
  });
});

app.use(express.json());
// Routes
app.use("/api", routes);

// Root
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Business  Service API",
    version: "1.0.0",
    docs: "/api/docs",
  });
});
// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await Database.connect();

    // Start listening
    app.listen(config.port, () => {
      logger.info(`🚀 Business Service running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  await Database.disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully...");
  await Database.disconnect();
  process.exit(0);
});

startServer();
