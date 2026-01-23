import { Router } from "express";
import resourceController from "../controllers/resource.controller";
import categoryController from "../controllers/category.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validator";
import {
  createResourceSchema,
  updateResourceSchema,
  bulkCreateResourceSchema,
  typeResourceSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../utils/validators";

const router = Router();

// Category Routes
//get all categories
router.get("/categories", authenticate, categoryController.getAllCategories);

//create category
router.post(
  "/categories",
  authenticate,
  authorize("VENDOR"),
  validate(createCategorySchema),
  categoryController.createCategory,
);

//get category by ID
router.get("/categories/:id", authenticate, categoryController.getCategoryById);

//update category
router.patch(
  "/categories/:id",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  validate(updateCategorySchema),
  categoryController.updateCategory,
);

//delete category
router.delete(
  "/categories/:id",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  categoryController.deleteCategory,
);

// Get All Resources (Vendor or Admin)
router.get(
  "/",
  authenticate,
  authorize("VENDOR"),
  resourceController.getAllResources,
);

// Create resource (Vendor only)
router.post(
  "/",
  authenticate,
  authorize("VENDOR"),
  validate(createResourceSchema),
  resourceController.createResource,
);

// Bulk create resources (Vendor only)
router.post(
  "/bulk",
  authenticate,
  authorize("VENDOR"),
  validate(bulkCreateResourceSchema),
  resourceController.bulkCreateResources,
);

// Get all resources (Public)

// Get resources by business (Public)
router.get(
  "/business/:businessId",
  authenticate,
  resourceController.getResourcesByBusiness,
);

// Get resources by type (Public)
router.get(
  "/type/:type",
  authenticate,
  validate(typeResourceSchema),
  resourceController.getResourcesByType,
);

// Get resource stats
router.get(
  "/stats/:businessId",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  resourceController.getResourceStats,
);

// Get resource by ID (Public)
router.get("/:id", resourceController.getResourceById);

// Update resource (Vendor or Admin)
router.patch(
  "/:id",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  validate(updateResourceSchema),
  resourceController.updateResource,
);

// Delete resource (Vendor or Admin)
router.delete(
  "/:id",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  resourceController.deleteResource,
);

// Toggle resource status (Vendor or Admin)
router.patch(
  "/:id/toggle-status",
  authenticate,
  authorize("VENDOR", "ADMIN"),
  resourceController.toggleResourceStatus,
);

export default router;
