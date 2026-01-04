import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import cookieParser from "cookie-parser";

import { errorHandler } from "./middlewares/error.middleware";
import { notFound } from "./middlewares/notFound.middleware";
import { authenticate } from "./middlewares/auth.middleware";
import dotenv from "dotenv";
import { SERVICES } from "./config/service";
import { createServiceProxy } from "./utils/proxy";
dotenv.config();
const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use((_req, res, next) => {
  res.setHeader("X-Served-By", "API-Gateway");
  next();
});

app.use(cookieParser());

// Auth routes (public)
app.use("/api/auth", createServiceProxy(SERVICES.AUTH));

// Business routes (public read, auth for write)
app.use("/api/businesses", createServiceProxy(SERVICES.BUSINESS));

// Resource routes (public read, auth for write)
app.use("/api/resources", createServiceProxy(SERVICES.RESOURCE));

// Booking routes (authenticated)
app.use("/api/bookings", authenticate, createServiceProxy(SERVICES.BOOKING));

// Health check
app.get("/health", (_, res) =>
  res.json({ status: "ok", service: "api-gateway" })
);

// Gateway safety net
app.use(errorHandler);
app.use(notFound);
app.listen(3000, () => console.log("🚪 API Gateway running on port 3000"));
