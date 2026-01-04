import { Resource, ResourceType, Prisma } from "@prisma/client";
import Database from "../config/database";

export class ResourceRepository {
  private prisma = Database.getInstance();

  /**
   * Create a new resource
   */
  async create(data: Prisma.ResourceCreateInput): Promise<Resource> {
    return this.prisma.resource.create({
      data,
    });
  }

  /**
   * Find resource by ID
   */
  async findById(id: string): Promise<Resource | null> {
    return this.prisma.resource.findUnique({
      where: { id },
    });
  }

  /**
   * Find all resources with filters
   */
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ResourceWhereInput;
    orderBy?: Prisma.ResourceOrderByWithRelationInput;
  }): Promise<Resource[]> {
    return this.prisma.resource.findMany(params);
  }

  /**
   * Count resources with filters
   */
  async count(where?: Prisma.ResourceWhereInput): Promise<number> {
    return this.prisma.resource.count({ where });
  }

  /**
   * Update resource by ID
   */
  async update(
    id: string,
    data: Prisma.ResourceUpdateInput
  ): Promise<Resource> {
    return this.prisma.resource.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete resource by ID
   */
  async delete(id: string): Promise<Resource> {
    return this.prisma.resource.delete({
      where: { id },
    });
  }

  /**
   * Find resources by vendor ID
   */
  async findByVendorId(
    vendorId: string,
    skip?: number,
    take?: number,
    isActive?: boolean
  ): Promise<Resource[]> {
    const where: Prisma.ResourceWhereInput = { vendorId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.resource.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find resources by type
   */
  async findByType(
    type: ResourceType,
    skip?: number,
    take?: number,
    isActive?: boolean
  ): Promise<Resource[]> {
    const where: Prisma.ResourceWhereInput = { type };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.resource.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find active resources
   */
  async findActive(skip?: number, take?: number): Promise<Resource[]> {
    return this.prisma.resource.findMany({
      where: { isActive: true },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Check if resource exists
   */
  async exists(id: string): Promise<boolean> {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!resource;
  }

  /**
   * Toggle resource active status
   */
  async toggleActiveStatus(id: string): Promise<Resource> {
    const resource = await this.findById(id);
    if (!resource) {
      throw new Error("Resource not found");
    }

    return this.update(id, {
      isActive: !resource.isActive,
    });
  }

  /**
   * Bulk create resources
   */
  async createMany(
    data: Prisma.ResourceCreateManyInput[]
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.resource.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Count resources by vendor
   */
  async countByVendor(vendorId: string): Promise<number> {
    return this.prisma.resource.count({
      where: { vendorId },
    });
  }

  /**
   * Find resources with pagination and filters
   */
  async findWithFilters(params: {
    vendorId?: string;
    type?: ResourceType;
    isActive?: boolean;
    minPrice?: number;
    maxPrice?: number;
    skip?: number;
    take?: number;
  }): Promise<Resource[]> {
    const where: Prisma.ResourceWhereInput = {};

    if (params.vendorId) {
      where.vendorId = params.vendorId;
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      where.price = {};
      if (params.minPrice !== undefined) {
        where.price.gte = params.minPrice;
      }
      if (params.maxPrice !== undefined) {
        where.price.lte = params.maxPrice;
      }
    }

    return this.prisma.resource.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
    });
  }
}

export default new ResourceRepository();
