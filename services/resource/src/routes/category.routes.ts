import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth";
import categoryController from "../controllers/category.controller";
import { validate } from "../middlewares/validator";
import {
  createCategorySchema,
  queryResourceCategorySchema,
} from "../utils/validators";
import resourceController from "../controllers/resource.controller";

const categoryRoutes = Router();

//create category
categoryRoutes.post(
  "/",
  authenticate,
  authorize("VENDOR"),
  validate(createCategorySchema),
  categoryController.createResourceCategory,
);

//get categories
categoryRoutes.get(
  "/",
  authenticate,
  validate(queryResourceCategorySchema),
  resourceController.getAllResourceCategories,
);

//update
// categoryRoutes.put(
//   "/:id",
//   authenticate,
//   authorize("VENDOR"),
//   validate(updateCategorySchema),
//   categoryController.updateResourceCategory,
// );

export default categoryRoutes;
