import { Router } from "express";
import bookingRoutes from "./booking.routes";
import resourceRoutes from "./resource.routes";

const router = Router();

// Mount booking routes
router.use("/bookings", bookingRoutes);

// Mount resource routes
router.use("/resources", resourceRoutes);

export default router;
