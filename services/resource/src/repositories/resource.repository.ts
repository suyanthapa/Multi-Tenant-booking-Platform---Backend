import { PrismaClient, Resource, ResourceType, Prisma } from "@prisma/client";
import Database from "../config/database";
import bookingClient from "../clients/booking.client";
import { NotFoundError } from "../utils/errors";

class ResourceRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getInstance();
  }

  async create(data: Prisma.ResourceCreateInput): Promise<Resource> {
    const businessExists = await bookingClient.validateBusiness(
      data.businessId
    );
    console.log("Business exists:", businessExists);
    if (!businessExists) {
      throw new NotFoundError("Business does not exist");
    }
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
    const result = await this.prisma.resource.findMany({
      where: { type },
      orderBy: { createdAt: "desc" },
    });

    if (result.length === 0) {
      throw new NotFoundError(`No resources found for type '${type}'`);
    }
    return result;
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
    const businessExists = await bookingClient.validateBusiness(businessId);
    if (!businessExists) {
      throw new NotFoundError("Business does not exist");
    }
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
