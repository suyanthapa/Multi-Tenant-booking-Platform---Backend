import express from "express";
import cors from "cors";
import morgan from "morgan";

import cookieParser from "cookie-parser";

import { errorHandler } from "./middlewares/error.middleware";
import { notFound } from "./middlewares/notFound.middleware";
import { authenticate } from "./middlewares/auth.middleware";
import { bookingLimiter } from "./middlewares/rateLimit.middleware";
import dotenv from "dotenv";
import { SERVICES } from "./config/service";
import { createServiceProxy } from "./utils/proxy";
dotenv.config();
const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(",")
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps/Postman)
      // or if the origin is in our allowed list
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS: Origin not allowed by Gateway"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  }),
);

app.use(morgan("dev"));

app.use((_req, res, next) => {
  res.setHeader("X-Served-By", "API-Gateway");
  next();
});

app.use(cookieParser());

// Apply general rate limiter to all routes
// app.use(generalLimiter);  --- for now disabled as it is too restrictive for testing, will enable later

// Auth routes with specific rate limiters
app.use("/api/auth", createServiceProxy(SERVICES.AUTH));

// Business routes (public read)  -- hotel search
app.use("/api/businesses/search", createServiceProxy(SERVICES.BUSINESS));

// list salons route (public read)  -- salon search
app.use("/api/businesses/search/salons", createServiceProxy(SERVICES.BUSINESS));

// Business routes (public read, auth for write)
app.use("/api/businesses", authenticate, createServiceProxy(SERVICES.BUSINESS));

// Business routes (ADMIN ONLY  )
app.use(
  "/api/admin/businesses",
  authenticate,
  createServiceProxy(SERVICES.BUSINESS),
);

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
