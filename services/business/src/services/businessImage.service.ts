import { BusinessImage } from "@prisma/client";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import businessImageRepository from "../repositories/businessImage.repository";
import businessRepository from "../repositories/business.repository";
import {
  NotFoundError,
  AuthorizationError,
  InvalidInputError,
} from "../utils/errors";

const MAX_IMAGES = 20;

class BusinessImageService {
  async uploadImages(
    businessId: string,
    files: Express.Multer.File[],
  ): Promise<BusinessImage[]> {
    const business = await businessRepository.findById(businessId);
    if (!business) throw new NotFoundError("Business not found");

    const currentCount = await businessImageRepository.count(businessId);
    if (currentCount + files.length > MAX_IMAGES) {
      throw new InvalidInputError(
        `Maximum ${MAX_IMAGES} photos allowed. You have ${currentCount} and are adding ${files.length}.`,
      );
    }

    // convert buffer to base64 and upload to Cloudinary
    const uploadResults: UploadApiResponse[] = await Promise.all(
      files.map((file) =>
        cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          {
            folder: `businesses/${businessId}`,
            resource_type: "image",
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
            transformation: [
              { width: 1920, height: 1080, crop: "limit", quality: "auto" },
            ],
          },
        ),
      ),
    );

    const hasCover = currentCount === 0;

    const imageData = uploadResults.map(
      (result: UploadApiResponse, index: number) => ({
        businessId,
        url: result.secure_url,
        publicId: result.public_id,
        isCover: hasCover && index === 0,
        order: currentCount + index,
      }),
    );

    await businessImageRepository.createMany(imageData);

    return businessImageRepository.findByBusinessId(businessId);
  }

  async getImages(businessId: string): Promise<BusinessImage[]> {
    return businessImageRepository.findByBusinessId(businessId);
  }

  async setCover(imageId: string, businessId: string): Promise<BusinessImage> {
    const image = await businessImageRepository.findById(imageId);
    if (!image) throw new NotFoundError("Image not found");
    if (image.businessId !== businessId) {
      throw new AuthorizationError(
        "This image does not belong to your business",
      );
    }
    return businessImageRepository.setCover(imageId, businessId);
  }

  async deleteImage(imageId: string, businessId: string): Promise<void> {
    const image = await businessImageRepository.findById(imageId);
    if (!image) throw new NotFoundError("Image not found");
    if (image.businessId !== businessId) {
      throw new AuthorizationError(
        "This image does not belong to your business",
      );
    }
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }
    await businessImageRepository.delete(imageId, businessId);
  }
}

export default new BusinessImageService();
