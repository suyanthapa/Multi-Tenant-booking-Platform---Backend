import { Router } from "express";
import businessController from "../controllers/business.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validator";
import {
  createBusinessSchema,
  updateBusinessSchema,
  queryBusinessSchema,
} from "../utils/validators";

const router = Router();

// Create business (Vendor only)
router.post(
  "/",
  authenticate,
  authorize("VENDOR"),
  validate(createBusinessSchema),
  businessController.createBusiness
);

// Get all businesses (Public)
router.get(
  "/",
  authenticate,
  validate(queryBusinessSchema),
  businessController.getAllBusinesses
);

// Get my businesses (Vendor only)
router.get(
  "/my-businesses",
  authenticate,
  authorize("VENDOR"),
  businessController.getBusinessesByOwner
);

// Get businesses by type (Public)
router.get("/type/:type", businessController.getBusinessesByType);

// Get business by ID (Public)
router.get("/:id", businessController.getBusinessById);

// Update business (Owner or Admin)
router.patch(
  "/:id",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  validate(updateBusinessSchema),
  businessController.updateBusiness
);

// Delete business (Owner or Admin)
router.delete(
  "/:id",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  businessController.deleteBusiness
);

// Toggle business status (Owner or Admin)
router.patch(
  "/:id/toggle-status",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  businessController.toggleBusinessStatus
);

// Verify business (Admin only)
router.patch(
  "/:id/verify",
  authenticate,
  authorize("ADMIN"),
  businessController.verifyBusiness
);
export default router;
