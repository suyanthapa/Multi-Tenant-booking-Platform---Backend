import { Router } from "express";
import bookingRoutes from "./booking.routes"; // your existing routes
import internalRoutes from "./internalRoutes";

const router = Router();

// existing booking routes
router.use("/bookings", bookingRoutes);

// internal — only reachable from within Docker network
router.use("/internal/bookings", internalRoutes);

export default router;
