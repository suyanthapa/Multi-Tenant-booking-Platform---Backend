// services/booking/src/routes/internal.routes.ts

import { Router } from "express";
import { internalAuthMiddleware } from "../utils/internalAuthMiddleware";
import internalBookingController from "../controllers/internal/booking.internal";
const internalRoutes = Router();

// POST /internal/bookings/unavailable-resources
// Called only by API Gateway to check resource availability for a date range
internalRoutes.post(
  "/unavailable-resources",
  internalAuthMiddleware, // Only other microservices CAN call this
  internalBookingController.getUnavailableResources,
);

internalRoutes.post(
  "/dashboard-bookings",
  internalAuthMiddleware,
  internalBookingController.getDashboardBookings,
);

export default internalRoutes;
