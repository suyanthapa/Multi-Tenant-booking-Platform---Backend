import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import categoryImageService from "../services/categoryImage.service";

class CategoryImageController {
  upload = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const businessId = req.user?.businessId as string;

    const files = req.files as Express.Multer.File[];

    const images = await Promise.all(
      files.map((file) =>
        categoryImageService.upload(id, businessId, file.buffer),
      ),
    );

    res.status(201).json({
      success: true,
      data: images,
    });
  });

  getByCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const images = await categoryImageService.getForCategory(id);

    res.status(200).json({ success: true, data: images });
  });

  setCover = asyncHandler(async (req: Request, res: Response) => {
    const { imageId } = req.params;
    const businessId = req.user?.businessId as string;

    const image = await categoryImageService.setCover(imageId, businessId);

    res.status(200).json({ success: true, data: image });
  });

  deleteImage = asyncHandler(async (req: Request, res: Response) => {
    const { imageId } = req.params;
    const businessId = req.user?.businessId as string;

    await categoryImageService.deleteImage(imageId, businessId);

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      data: null,
    });
  });
}

export default new CategoryImageController();
