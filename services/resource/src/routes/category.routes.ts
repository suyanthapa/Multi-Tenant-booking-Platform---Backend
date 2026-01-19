import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth";
import categoryController from "../controllers/category.controller";
import { validate } from "../middlewares/validator";
import { createCategorySchema } from "../utils/validators";

const categoryRoutes = Router();

categoryRoutes.post(
  "/",
  authenticate,
  authorize("VENDOR"),
  validate(createCategorySchema),
  categoryController.createResourceCategory,
);

export default categoryRoutes;
