import { Router } from "express";
import businessController from "../controllers/business.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validator";
import {
  createBusinessSchema,
  queryBusinessSchema,
  rejectBusinessSchema,
  updateBusinessSchema,
} from "../dtos/business.dto";

const businessRoutes = Router();

// Create business (Vendor only)
businessRoutes.post(
  "/",
  authenticate,
  authorize("VENDOR"),
  validate(createBusinessSchema),
  businessController.createBusiness,
);

// Get all businesses (Public)
businessRoutes.get(
  "/",
  authenticate,
  validate(queryBusinessSchema),
  businessController.getAllBusinesses,
);

// Get my businesses (Vendor only)
businessRoutes.get(
  "/my-businesses",
  authenticate,
  authorize("VENDOR"),
  businessController.getBusinessesByOwner,
);
// Get active resource categories for a business -- hotel (Public)
businessRoutes.post("/search", businessController.checkAvailableSlots);

// Get active resource categories for a business -- salon (Public)
businessRoutes.post("/search/salons", businessController.listSalons);

// Approve  business (Admin only)
businessRoutes.patch(
  "/:id/approve",
  authenticate,
  authorize("ADMIN"),
  businessController.approveBusiness,
);

// Reject  business (Admin only)
businessRoutes.patch(
  "/:id/reject",
  authenticate,
  authorize("ADMIN"),
  validate(rejectBusinessSchema),
  businessController.rejectBusiness,
);
// Get businesses by type (Public)
businessRoutes.get("/type/:type", businessController.getBusinessesByType);

// Get business by ID (Public)
businessRoutes.get("/:id", businessController.getBusinessById);

// Update business (Owner or Admin)
businessRoutes.patch(
  "/:id",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  validate(updateBusinessSchema),
  businessController.updateBusiness,
);

// Delete business (Owner or Admin)
businessRoutes.delete(
  "/:id",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  businessController.deleteBusiness,
);

// Toggle business status (Owner or Admin)
businessRoutes.patch(
  "/:id/toggle-status",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  businessController.toggleBusinessStatus,
);

// Verify business (Admin only)
businessRoutes.patch(
  "/:id/verify",
  authenticate,
  authorize("ADMIN"),
  businessController.verifyBusiness,
);

export default businessRoutes;
