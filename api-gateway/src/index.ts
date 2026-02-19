import express from "express";
import cors from "cors";
import morgan from "morgan";

import cookieParser from "cookie-parser";

import { errorHandler } from "./middlewares/error.middleware";
import { notFound } from "./middlewares/notFound.middleware";
import { authenticate } from "./middlewares/auth.middleware";
import {
  generalLimiter,
  bookingLimiter,
} from "./middlewares/rateLimit.middleware";
import dotenv from "dotenv";
import { SERVICES } from "./config/service";
import { createServiceProxy } from "./utils/proxy";
dotenv.config();
const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true); // Allow all origins
    },
    credentials: true,
  }),
);

app.use(morgan("dev"));

app.use((_req, res, next) => {
  res.setHeader("X-Served-By", "API-Gateway");
  next();
});

app.use(cookieParser());

// Apply general rate limiter to all routes
app.use(generalLimiter);

// Auth routes with specific rate limiters
app.use("/api/auth", createServiceProxy(SERVICES.AUTH));

// Business routes (public read, auth for write)
app.use("/api/businesses", createServiceProxy(SERVICES.BUSINESS));

// Resource routes (public read, auth for write)
app.use("/api/resources", authenticate, createServiceProxy(SERVICES.RESOURCE));

// Booking routes with specific rate limiter
app.use(
  "/api/bookings",
  authenticate,
  bookingLimiter,
  createServiceProxy(SERVICES.BOOKING),
);

// Health check
app.get("/health", (_, res) =>
  res.json({ status: "ok", service: "api-gateway" }),
);

// Gateway safety net
app.use(errorHandler);
app.use(notFound);
app.listen(8000, () => console.log("🚪 API Gateway running on port 8000"));
