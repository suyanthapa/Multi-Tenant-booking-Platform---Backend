import { PrismaClient, BusinessImage } from "@prisma/client";
import Database from "../config/database";

class BusinessImageRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getInstance();
  }

  // Get all images for a business
  async findByBusinessId(businessId: string): Promise<BusinessImage[]> {
    return this.prisma.businessImage.findMany({
      where: { businessId },
      orderBy: { order: "asc" },
    });
  }

  // Create a single image
  async create(data: {
    businessId: string;
    url: string;
    publicId: string;
    isCover: boolean;
    order: number;
  }): Promise<BusinessImage> {
    return this.prisma.businessImage.create({ data });
  }

  // Create many images at once
  async createMany(
    images: {
      businessId: string;
      url: string;
      publicId: string;
      isCover: boolean;
      order: number;
    }[],
  ): Promise<void> {
    await this.prisma.businessImage.createMany({ data: images });
  }

  // Set an image as cover — unset others first
  async setCover(imageId: string, businessId: string): Promise<BusinessImage> {
    return this.prisma.$transaction(async (tx) => {
      // unset all covers for this business
      await tx.businessImage.updateMany({
        where: { businessId },
        data: { isCover: false },
      });

      // set the new cover
      return tx.businessImage.update({
        where: { id: imageId },
        data: { isCover: true },
      });
    });
  }

  // Delete a single image
  async delete(imageId: string, businessId: string): Promise<BusinessImage> {
    return this.prisma.businessImage.delete({
      where: { id: imageId, businessId },
    });
  }

  // Find a single image
  async findById(imageId: string): Promise<BusinessImage | null> {
    return this.prisma.businessImage.findUnique({
      where: { id: imageId },
    });
  }

  // Count images for a business
  async count(businessId: string): Promise<number> {
    return this.prisma.businessImage.count({ where: { businessId } });
  }
}

export default new BusinessImageRepository();
