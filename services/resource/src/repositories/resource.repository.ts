import { PrismaClient, Resource, ResourceType, Prisma } from "@prisma/client";
import Database from "../config/database";

class ResourceRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getInstance();
  }

  async create(data: Prisma.ResourceCreateInput): Promise<Resource> {
    return this.prisma.resource.create({ data });
  }

  async createMany(data: Prisma.ResourceCreateManyInput[]): Promise<number> {
    const result = await this.prisma.resource.createMany({ data });
    return result.count;
  }

  async findById(id: string): Promise<Resource | null> {
    return this.prisma.resource.findUnique({
      where: { id },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ResourceWhereInput;
    orderBy?: Prisma.ResourceOrderByWithRelationInput;
  }): Promise<Resource[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.resource.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async count(where?: Prisma.ResourceWhereInput): Promise<number> {
    return this.prisma.resource.count({ where });
  }

  async update(
    id: string,
    data: Prisma.ResourceUpdateInput
  ): Promise<Resource> {
    return this.prisma.resource.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Resource> {
    return this.prisma.resource.delete({
      where: { id },
    });
  }

  async findByBusiness(businessId: string): Promise<Resource[]> {
    return this.prisma.resource.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByType(type: ResourceType): Promise<Resource[]> {
    return this.prisma.resource.findMany({
      where: { type },
      orderBy: { createdAt: "desc" },
    });
  }

  async toggleStatus(id: string): Promise<Resource> {
    const resource = await this.findById(id);
    if (!resource) {
      throw new Error("Resource not found");
    }

    // Toggle between ACTIVE and INACTIVE
    const newStatus = resource.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    return this.prisma.resource.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async getStatsByBusiness(businessId: string) {
    const [total, active, inactive, maintenance] = await Promise.all([
      this.count({ businessId }),
      this.count({ businessId, status: "ACTIVE" }),
      this.count({ businessId, status: "INACTIVE" }),
      this.count({ businessId, status: "MAINTENANCE" }),
    ]);

    return {
      total,
      active,
      inactive,
      maintenance,
    };
  }
}

export default new ResourceRepository();
