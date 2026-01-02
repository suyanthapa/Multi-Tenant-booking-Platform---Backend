import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import bookingProxy from "./routes/booking.proxy";
import authProxy from "./routes/auth.proxy";
import { errorHandler } from "./middlewares/error.middleware";
import { notFound } from "./middlewares/notFound.middleware";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/auth", authProxy);
app.use("/api/bookings", bookingProxy);

app.get("/health", (_, res) =>
  res.json({ status: "ok", service: "api-gateway" })
);

// Gateway safety net
app.use(errorHandler);
app.use(notFound);
app.listen(3000, () => console.log("🚪 API Gateway running on port 3000"));
