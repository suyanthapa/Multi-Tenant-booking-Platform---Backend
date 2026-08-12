import { PrismaClient, CategoryImage } from "@prisma/client";
import Database from "../config/database";
import { dbHandler } from "../utils/repositoryHandler";

class CategoryImageRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getInstance();
  }

  create = dbHandler(
    async (data: {
      categoryId: string;
      url: string;
      publicId?: string;
      isCover: boolean;
    }): Promise<CategoryImage> => {
      return this.prisma.categoryImage.create({ data });
    },
  );

  findById = dbHandler(async (id: string): Promise<CategoryImage | null> => {
    return this.prisma.categoryImage.findUnique({ where: { id } });
  });

  findByCategory = dbHandler(
    async (categoryId: string): Promise<CategoryImage[]> => {
      return this.prisma.categoryImage.findMany({
        where: { categoryId },
        orderBy: [{ isCover: "desc" }, { order: "asc" }, { createdAt: "asc" }],
      });
    },
  );

  countByCategory = dbHandler(async (categoryId: string): Promise<number> => {
    return this.prisma.categoryImage.count({ where: { categoryId } });
  });

  findFirstByCategory = dbHandler(
    async (categoryId: string): Promise<CategoryImage | null> => {
      return this.prisma.categoryImage.findFirst({
        where: { categoryId },
        orderBy: { createdAt: "asc" },
      });
    },
  );

  unsetCoverForCategory = dbHandler(
    async (categoryId: string): Promise<number> => {
      const result = await this.prisma.categoryImage.updateMany({
        where: { categoryId, isCover: true },
        data: { isCover: false },
      });
      return result.count;
    },
  );

  setCover = dbHandler(async (id: string): Promise<CategoryImage> => {
    return this.prisma.categoryImage.update({
      where: { id },
      data: { isCover: true },
    });
  });

  delete = dbHandler(async (id: string): Promise<CategoryImage> => {
    return this.prisma.categoryImage.delete({ where: { id } });
  });
}

export default new CategoryImageRepository();
