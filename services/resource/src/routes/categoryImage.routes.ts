import { Router } from "express";
import categoryImageController from "../controllers/categoryImage.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { upload } from "../middlewares/upload.middleware";

const ImageRoutes = Router();

ImageRoutes.post(
  "/:id/images",
  authenticate,
  authorize("VENDOR"),
  upload.array("images", 10), // up to 10 images
  categoryImageController.upload,
);

ImageRoutes.get("/:id/images", categoryImageController.getByCategory); // public — storefront needs these

ImageRoutes.patch(
  "/:id/images/:imageId/cover",
  authenticate,
  authorize("VENDOR"),
  categoryImageController.setCover,
);

ImageRoutes.delete(
  "/:id/images/:imageId",
  authenticate,
  authorize("VENDOR"),
  categoryImageController.deleteImage,
);

export default ImageRoutes;
