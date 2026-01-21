import { Resource, ResourceCategory, ResourceType } from "@prisma/client";
import resourceRepository from "../repositories/resource.repository";
import { NotFoundError } from "../utils/errors";
import {
  UpdateResourceInput,
  BulkCreateResourceInput,
} from "../utils/validators";
import { CreateResourceDTO } from "../types/interfaces";

class ResourceService {
  async createResource(data: CreateResourceDTO): Promise<Resource> {
    return resourceRepository.create(data);
  }

  async bulkCreateResources(
    data: BulkCreateResourceInput,
  ): Promise<{ count: number }> {
    const { businessId, resources } = data;

    const resourcesWithBusinessId = resources.map((resource) => ({
      ...resource,
      businessId,
    }));

    const count = await resourceRepository.createMany(resourcesWithBusinessId);

    return { count };
  }

  async getResourceById(id: string): Promise<Resource> {
    const resource = await resourceRepository.findById(id);
    if (!resource) {
      throw new NotFoundError("Resource not found");
    }
    return resource;
  }

  async getAllResources(params: {
    page?: number;
    limit?: number;
    businessId?: string;
    type?: ResourceType;
    status?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{
    resources: Resource[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.businessId) {
      where.businessId = params.businessId;
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.status) {
      where.status = params.status.toUpperCase();
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
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

    const [resources, total] = await Promise.all([
      resourceRepository.findAllResources({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
      }),
      resourceRepository.count(where),
    ]);

    return {
      resources,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getResourcesByBusiness(businessId: string): Promise<Resource[]> {
    return resourceRepository.findByBusiness(businessId);
  }

  async getResourcesByType(type: ResourceType): Promise<Resource[]> {
    return resourceRepository.findByType(type);
  }

  async updateResource(
    id: string,
    data: UpdateResourceInput,
  ): Promise<Resource> {
    // First verify resource exists
    await this.getResourceById(id);

    return resourceRepository.update(id, data);
  }

  async deleteResource(id: string): Promise<void> {
    // First verify resource exists
    await this.getResourceById(id);

    await resourceRepository.delete(id);
  }

  async toggleResourceStatus(id: string, userRole: string): Promise<Resource> {
    // First verify resource exists
    await this.getResourceById(id);

    return resourceRepository.toggleStatus(id, userRole);
  }

  async getResourceStats(businessId: string) {
    return resourceRepository.getStatsByBusiness(businessId);
  }

  //create resouirce category
  async createCategory(name: string, businessId: string) {
    return resourceRepository.createCategory(name, businessId);
  }

  //get all categories
  async getAllResourceCategories(params: {
    page?: number;
    limit?: number;
    businessId?: string;
    search?: string;
  }): Promise<{
    resources: ResourceCategory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.businessId) {
      where.businessId = params.businessId;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [resources, total] = await Promise.all([
      resourceRepository.findAllCategories({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
      }),
      resourceRepository.count(where),
    ]);

    return {
      resources,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export default new ResourceService();
