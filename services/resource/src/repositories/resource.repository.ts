import {
  PrismaClient,
  Resource,
  ResourceType,
  Prisma,
  ResourceCategory,
} from "@prisma/client";
import Database from "../config/database";
import bookingClient from "../clients/business.client";
import { ForbiddenError, NotFoundError } from "../utils/errors";
import { ActiveResourceInfo, CreateResourceDTO } from "../types/interfaces";
import { dbHandler } from "../utils/repositoryHandler";

class ResourceRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getInstance();
  }

  create = dbHandler(async (data: CreateResourceDTO): Promise<Resource> => {
    const businessExists = await bookingClient.validateBusiness(
      data.businessId,
    );

    if (!businessExists) {
      throw new NotFoundError("Business does not exist");
    }
    console.log("Creating resource with data:", data);
    return await this.prisma.resource.create({ data });
  });

  createMany = dbHandler(
    async (data: Prisma.ResourceCreateManyInput[]): Promise<number> => {
      const result = await this.prisma.resource.createMany({ data });
      return result.count;
    },
  );

  //find all resources
  findAllResources = dbHandler(
    async (params: {
      skip?: number;
      take?: number;
      where?: Prisma.ResourceWhereInput;
      orderBy?: Prisma.ResourceOrderByWithRelationInput;
    }): Promise<Resource[]> => {
      const { skip, take, where, orderBy } = params;
      return this.prisma.resource.findMany({
        skip,
        take,
        where,
        orderBy,
      });
    },
  );

  findById = dbHandler(async (id: string): Promise<Resource | null> => {
    return this.prisma.resource.findUnique({
      where: { id },
    });
  });

  count = dbHandler(
    async (where?: Prisma.ResourceWhereInput): Promise<number> => {
      return this.prisma.resource.count({ where });
    },
  );

  update = dbHandler(
    async (id: string, data: Prisma.ResourceUpdateInput): Promise<Resource> => {
      return this.prisma.resource.update({
        where: { id },
        data,
      });
    },
  );

  delete = dbHandler(async (id: string): Promise<Resource> => {
    return this.prisma.resource.delete({
      where: { id },
    });
  });

  findByBusiness = dbHandler(
    async (businessId: string): Promise<Resource[]> => {
      return this.prisma.resource.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
      });
    },
  );

  findByType = dbHandler(async (type: ResourceType): Promise<Resource[]> => {
    const result = await this.prisma.resource.findMany({
      where: { type },
      orderBy: { createdAt: "desc" },
    });

    if (result.length === 0) {
      throw new NotFoundError(`No resources found for type '${type}'`);
    }
    return result;
  });

  toggleStatus = dbHandler(
    async (id: string, userRole: string): Promise<Resource> => {
      const resource = await this.findById(id);
      if (!resource) {
        throw new NotFoundError("Resource not found");
      }

      const restrictedStatuses = ["MAINTENANCE", "DELETED"];

      if (
        restrictedStatuses.includes(resource.status) &&
        userRole !== "ADMIN"
      ) {
        throw new ForbiddenError(`You cannot modify a resource `);
      }

      // Toggle between ACTIVE and INACTIVE
      const newStatus = resource.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

      return this.prisma.resource.update({
        where: { id },
        data: { status: newStatus },
      });
    },
  );

  getStatsByBusiness = dbHandler(async (businessId: string) => {
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
  });

  checkExists = dbHandler(
    async (id: string, name: string): Promise<ResourceCategory | null> => {
      return await this.prisma.resourceCategory.findFirst({
        where: { id, name },
      });
    },
  );

  createCategory = dbHandler(async (name: string, businessId: string) => {
    return this.prisma.resourceCategory.create({
      data: { name, businessId },
    });
  });

  findAllCategories = dbHandler(
    async (params: {
      skip?: number;
      take?: number;
      where?: Prisma.ResourceCategoryWhereInput;
      orderBy?: Prisma.ResourceCategoryOrderByWithRelationInput;
    }): Promise<ResourceCategory[]> => {
      const { skip, take, where, orderBy } = params;
      return this.prisma.resourceCategory.findMany({
        skip,
        take,
        where,
        orderBy,
      });
    },
  );

  //check activbe resources in category
  activeResourcesInCategory = dbHandler(
    async (categoryId: string): Promise<ActiveResourceInfo[]> => {
      const resources = await this.prisma.resource.findMany({
        where: {
          categoryId,
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
      });

      return resources.map((resource) => ({
        id: resource.id,
        name: resource.name,
        type: resource.type,
      }));
    },
  );
}
export default new ResourceRepository();
