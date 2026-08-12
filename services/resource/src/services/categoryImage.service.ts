import { CategoryImage } from "@prisma/client";
import cloudinary from "../config/cloudinary";
import categoryImageRepository from "../repositories/categoryImage.repository";
import resourceRepository from "../repositories/resource.repository";
import { NotFoundError, ForbiddenError } from "../utils/errors";

class CategoryImageService {
  private uploadToCloudinary(file: Buffer, folder: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [{ width: 1600, height: 1600, crop: "limit" }],
        },
        (err, result) => (err ? reject(err) : resolve(result)),
      );
      stream.end(file);
    });
  }

  private async assertOwnership(categoryId: string, businessId: string) {
    const category = await resourceRepository.findCategoryById(categoryId);
    if (!category) {
      throw new NotFoundError("Category not found");
    }
    if (category.businessId !== businessId) {
      throw new ForbiddenError(
        "You are not authorized to modify this category",
      );
    }
    return category;
  }

  async upload(
    categoryId: string,
    businessId: string,
    file: Buffer,
  ): Promise<CategoryImage> {
    await this.assertOwnership(categoryId, businessId);

    const folder = `vendors/${businessId}/categories/${categoryId}`;
    const result = await this.uploadToCloudinary(file, folder);

    const existingCount =
      await categoryImageRepository.countByCategory(categoryId);
    const isCover = existingCount === 0;

    if (isCover) {
      await categoryImageRepository.unsetCoverForCategory(categoryId);
    }

    return categoryImageRepository.create({
      categoryId,
      url: result.secure_url,
      publicId: result.public_id,
      isCover,
    });
  }

  async getForCategory(categoryId: string): Promise<CategoryImage[]> {
    return categoryImageRepository.findByCategory(categoryId);
  }

  async setCover(imageId: string, businessId: string): Promise<CategoryImage> {
    const image = await categoryImageRepository.findById(imageId);
    if (!image) {
      throw new NotFoundError("Image not found");
    }
    await this.assertOwnership(image.categoryId, businessId);

    await categoryImageRepository.unsetCoverForCategory(image.categoryId);
    return categoryImageRepository.setCover(imageId);
  }

  async deleteImage(imageId: string, businessId: string): Promise<void> {
    const image = await categoryImageRepository.findById(imageId);
    if (!image) {
      throw new NotFoundError("Image not found");
    }
    await this.assertOwnership(image.categoryId, businessId);

    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }
    await categoryImageRepository.delete(imageId);

    if (image.isCover) {
      const next = await categoryImageRepository.findFirstByCategory(
        image.categoryId,
      );
      if (next) {
        await categoryImageRepository.setCover(next.id);
      }
    }
  }
}

export default new CategoryImageService();
