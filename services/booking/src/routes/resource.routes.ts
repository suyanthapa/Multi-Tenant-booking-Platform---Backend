import { Router } from "express";
import resourceController from "../controllers/resource.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validator";
import {
  createResourceSchema,
  updateResourceSchema,
  getResourceByIdSchema,
  getResourcesSchema,
  getResourcesByVendorSchema,
  getResourcesByTypeSchema,
  bulkCreateResourcesSchema,
  getVendorResourceStatsSchema,
} from "../utils/validators";

const router = Router();

/**
 * @route   POST /api/resources
 * @desc    Create a new resource
 * @access  Private (Vendor, Admin)
 */
router.post(
  "/",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  validate(createResourceSchema),
  resourceController.createResource
);

/**
 * @route   GET /api/resources
 * @desc    Get all resources with filters
 * @access  Public
 */
router.get("/", validate(getResourcesSchema), resourceController.getResources);

/**
 * @route   GET /api/resources/active
 * @desc    Get active resources
 * @access  Public
 */
router.get("/active", resourceController.getActiveResources);

/**
 * @route   POST /api/resources/bulk
 * @desc    Bulk create resources
 * @access  Private (Vendor, Admin)
 */
router.post(
  "/bulk",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  validate(bulkCreateResourcesSchema),
  resourceController.bulkCreateResources
);

/**
 * @route   GET /api/resources/vendor/:vendorId
 * @desc    Get resources by vendor
 * @access  Public
 */
router.get(
  "/vendor/:vendorId",
  validate(getResourcesByVendorSchema),
  resourceController.getResourcesByVendor
);

/**
 * @route   GET /api/resources/vendor/:vendorId/stats
 * @desc    Get vendor resource statistics
 * @access  Private (Vendor, Admin)
 */
router.get(
  "/vendor/:vendorId/stats",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  validate(getVendorResourceStatsSchema),
  resourceController.getVendorResourceStats
);

/**
 * @route   GET /api/resources/type/:type
 * @desc    Get resources by type
 * @access  Public
 */
router.get(
  "/type/:type",
  validate(getResourcesByTypeSchema),
  resourceController.getResourcesByType
);

/**
 * @route   GET /api/resources/:id
 * @desc    Get resource by ID
 * @access  Public
 */
router.get(
  "/:id",
  validate(getResourceByIdSchema),
  resourceController.getResourceById
);

/**
 * @route   PATCH /api/resources/:id
 * @desc    Update resource
 * @access  Private (Vendor, Admin)
 */
router.patch(
  "/:id",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  validate(updateResourceSchema),
  resourceController.updateResource
);

/**
 * @route   DELETE /api/resources/:id
 * @desc    Delete resource
 * @access  Private (Vendor, Admin)
 */
router.delete(
  "/:id",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  validate(getResourceByIdSchema),
  resourceController.deleteResource
);

/**
 * @route   PATCH /api/resources/:id/toggle-status
 * @desc    Toggle resource active status
 * @access  Private (Vendor, Admin)
 */
router.patch(
  "/:id/toggle-status",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  validate(getResourceByIdSchema),
  resourceController.toggleResourceStatus
);

export default router;
