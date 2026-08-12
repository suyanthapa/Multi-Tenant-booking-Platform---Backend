import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/response";
import businessImageService from "../services/businessImage.service";

class BusinessImageController {
  // Upload multiple business  photos
  uploadImages = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user!.businessId as string;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: "No files uploaded" });
      return;
    }

    const images = await businessImageService.uploadImages(businessId, files);

    successResponse(res, images, "Images uploaded successfully", 201);
  });

  // Get all images for a specific business

  getImages = asyncHandler(async (req: Request, res: Response) => {
    console.log("Fetching images for user GATEWAY:", req.user);
    const businessId = req.user!.businessId as string;
    console.log("Fetching images for businessId:", businessId);
    const images = await businessImageService.getImages(businessId);

    successResponse(res, images, "Images fetched successfully");
  });

  // PATCH /businesses/images/:imageId/cover
  // Set an image as cover
  setCover = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user!.businessId as string;
    const { imageId } = req.params;

    const image = await businessImageService.setCover(imageId, businessId);

    successResponse(res, image, "Cover image updated successfully");
  });

  // DELETE /businesses/images/:imageId
  // Delete an image
  deleteImage = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user!.businessId as string;
    const { imageId } = req.params;

    await businessImageService.deleteImage(imageId, businessId);

    successResponse(res, null, "Image deleted successfully");
  });
}

export default new BusinessImageController();
