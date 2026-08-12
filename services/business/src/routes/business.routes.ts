import { Router } from "express";
import businessController from "../controllers/business.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validator";
import {
  checkAvailabilitySchema,
  createBusinessSchema,
  queryBusinessSchema,
  updateBusinessSchema,
} from "../dtos/business.dto";
import { setupBasicsSchema } from "../dtos/setup.business.dto";
import setupBusinessController from "../controllers/setup.business.controller";

const businessRoutes = Router();

// Step 1-- profile setup
businessRoutes.get(
  "/profile",
  authenticate,
  authorize("VENDOR"),
  businessController.getProfile,
);

// Mark step complete (Vendor only)
businessRoutes.patch(
  "/setup/step-complete",
  authenticate,
  authorize("VENDOR"),
  businessController.markStepComplete,
);
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
businessRoutes.post(
  "/search",
  validate(checkAvailabilitySchema),
  businessController.checkAvailableSlots,
);

// Get active resource categories for a business -- salon (Public)
businessRoutes.post("/search/salons", businessController.listSalons);

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

// step1 -- SETUP business profile
businessRoutes.patch(
  "/setup/basics",
  authenticate,
  authorize("VENDOR"),
  validate(setupBasicsSchema),
  setupBusinessController.setupBasics,
);

export default businessRoutes;
