import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth";
import businessImageController from "../controllers/businessImage.controller";
import { upload } from "../middlewares/upload.middleware";

const imageRoutes = Router();

// GET  Images
imageRoutes.get(
  "/",
  authenticate,
  authorize("VENDOR"),
  businessImageController.getImages,
);

// Add images to a business
imageRoutes.post(
  "/",
  authenticate,
  authorize("VENDOR"),
  upload.array("images", 10),
  businessImageController.uploadImages,
);

// Add an image as cover for a business
imageRoutes.patch(
  "/:imageId/cover",
  authenticate,
  authorize("VENDOR"),
  businessImageController.setCover,
);

// Delete image from a business
imageRoutes.delete(
  "/:imageId",
  authenticate,
  authorize("VENDOR"),
  businessImageController.deleteImage,
);

export default imageRoutes;
