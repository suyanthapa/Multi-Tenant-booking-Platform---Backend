import express, { Application } from "express";
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
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(morgan("combined")); // HTTP request logger

// Health check
app.get("/health", async (_req, res) => {
  const dbHealthy = await Database.healthCheck();
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? "healthy" : "unhealthy",
    service: "resource-service",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api", routes);

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
      logger.info(`🚀 Resource Service running on port ${config.port}`);
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
