import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import cookieParser from "cookie-parser";
import bookingProxy from "./routes/booking.proxy";
import authProxy from "./routes/auth.proxy";
import { errorHandler } from "./middlewares/error.middleware";
import { notFound } from "./middlewares/notFound.middleware";
import { authenticate } from "./middlewares/auth.middleware";
import dotenv from "dotenv";
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

app.use("/api/auth", authProxy);
app.use("/api/bookings", authenticate, bookingProxy);

app.get("/health", (_, res) =>
  res.json({ status: "ok", service: "api-gateway" })
);

// Gateway safety net
app.use(errorHandler);
app.use(notFound);
app.listen(3000, () => console.log("🚪 API Gateway running on port 3000"));
