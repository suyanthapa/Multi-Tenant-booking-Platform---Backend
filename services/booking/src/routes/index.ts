import { Router } from "express";
import bookingRoutes from "./booking.routes";

const router = Router();

// Mount booking routes
router.use("/bookings", bookingRoutes);

export default router;
