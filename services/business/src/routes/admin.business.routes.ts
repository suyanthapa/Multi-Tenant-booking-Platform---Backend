import { Router } from "express";
import businessController from "../controllers/business.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validator";
import {
  approveBusinessSchema,
  rejectBusinessSchema,
} from "../dtos/business.dto";

const adminRoutes = Router();

// Approve  business (Admin only)
adminRoutes.patch(
  "/:id/approve",
  authenticate,
  authorize("ADMIN"),
  validate(approveBusinessSchema),
  businessController.approveBusiness,
);

// Reject  business (Admin only)
adminRoutes.patch(
  "/:id/reject",
  authenticate,
  authorize("ADMIN"),
  validate(rejectBusinessSchema),
  businessController.rejectBusiness,
);

// Verify business (Admin only)
adminRoutes.patch(
  "/:id/verify",
  authenticate,
  authorize("ADMIN"),
  businessController.verifyBusiness,
);

export default adminRoutes;
