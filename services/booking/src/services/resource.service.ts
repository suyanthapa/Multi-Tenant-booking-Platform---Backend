import { Resource, ResourceType } from "@prisma/client";
import resourceRepository from "../repositories/resource.repository";
import { NotFoundError, ValidationError } from "../utils/errors";

export interface CreateResourceDTO {
  vendorId: string;
  name: string;
  type: ResourceType;
  description?: string;
  price: number;
  currency?: string;
}

export interface UpdateResourceDTO {
  name?: string;
  type?: ResourceType;
  description?: string;
  price?: number;
  currency?: string;
  isActive?: boolean;
}

export interface ResourceQueryParams {
  page?: number;
  limit?: number;
  vendorId?: string;
  type?: ResourceType;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

class ResourceService {
  /**
   * Create a new resource
   */
  async createResource(data: CreateResourceDTO): Promise<Resource> {
    // Validate price
    if (data.price <= 0) {
      throw new ValidationError("Price must be greater than zero");
    }

    // Create resource
    const resource = await resourceRepository.create({
      vendorId: data.vendorId,
      name: data.name,
      type: data.type,
      description: data.description,
      price: data.price,
      currency: data.currency || "USD",
      isActive: true,
    });

    return resource;
  }

  /**
   * Get resource by ID
   */
  async getResourceById(id: string): Promise<Resource> {
    const resource = await resourceRepository.findById(id);

    if (!resource) {
      throw new NotFoundError("Resource not found");
    }

    return resource;
  }

  /**
   * Get all resources with filters and pagination
   */
  async getResources(params: ResourceQueryParams): Promise<{
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

    if (params.vendorId) {
      where.vendorId = params.vendorId;
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [resources, total] = await Promise.all([
      resourceRepository.findWithFilters({
        ...params,
        skip,
        take: limit,
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

  /**
   * Update resource
   */
  async updateResource(id: string, data: UpdateResourceDTO): Promise<Resource> {
    // Check if resource exists
    await this.getResourceById(id);

    // Validate price if provided
    if (data.price !== undefined && data.price <= 0) {
      throw new ValidationError("Price must be greater than zero");
    }

    const updateData: any = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.price !== undefined) {
      updateData.price = data.price;
    }

    if (data.currency !== undefined) {
      updateData.currency = data.currency;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    const resource = await resourceRepository.update(id, updateData);
    return resource;
  }

  /**
   * Delete resource
   */
  async deleteResource(id: string): Promise<Resource> {
    // Check if resource exists
    await this.getResourceById(id);

    // TODO: Check if resource has any active bookings
    // If there are active bookings, you might want to prevent deletion
    // or handle it based on business logic

    const resource = await resourceRepository.delete(id);
    return resource;
  }

  /**
   * Toggle resource active status
   */
  async toggleResourceStatus(id: string): Promise<Resource> {
    // Check if resource exists
    await this.getResourceById(id);

    const resource = await resourceRepository.toggleActiveStatus(id);
    return resource;
  }

  /**
   * Get resources by vendor
   */
  async getResourcesByVendor(
    vendorId: string,
    page: number = 1,
    limit: number = 10,
    isActive?: boolean
  ): Promise<{
    resources: Resource[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = { vendorId };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [resources, total] = await Promise.all([
      resourceRepository.findByVendorId(vendorId, skip, limit, isActive),
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

  /**
   * Get resources by type
   */
  async getResourcesByType(
    type: ResourceType,
    page: number = 1,
    limit: number = 10,
    isActive?: boolean
  ): Promise<{
    resources: Resource[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = { type };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [resources, total] = await Promise.all([
      resourceRepository.findByType(type, skip, limit, isActive),
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

  /**
   * Get active resources
   */
  async getActiveResources(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    resources: Resource[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [resources, total] = await Promise.all([
      resourceRepository.findActive(skip, limit),
      resourceRepository.count({ isActive: true }),
    ]);

    return {
      resources,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Bulk create resources
   */
  async bulkCreateResources(
    resources: CreateResourceDTO[]
  ): Promise<{ count: number }> {
    // Validate all resources
    for (const resource of resources) {
      if (resource.price <= 0) {
        throw new ValidationError(
          `Invalid price for resource: ${resource.name}`
        );
      }
    }

    const data = resources.map((r) => ({
      vendorId: r.vendorId,
      name: r.name,
      type: r.type,
      description: r.description,
      price: r.price,
      currency: r.currency || "USD",
      isActive: true,
    }));

    const result = await resourceRepository.createMany(data);
    return { count: result.count };
  }

  /**
   * Get vendor resource statistics
   */
  async getVendorResourceStats(vendorId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: { type: ResourceType; count: number }[];
  }> {
    const [total, active, inactive, allResources] = await Promise.all([
      resourceRepository.countByVendor(vendorId),
      resourceRepository.count({ vendorId, isActive: true }),
      resourceRepository.count({ vendorId, isActive: false }),
      resourceRepository.findByVendorId(vendorId),
    ]);

    // Group by type
    const typeCount: { [key in ResourceType]?: number } = {};
    allResources.forEach((resource) => {
      typeCount[resource.type] = (typeCount[resource.type] || 0) + 1;
    });

    const byType = Object.entries(typeCount).map(([type, count]) => ({
      type: type as ResourceType,
      count: count as number,
    }));

    return {
      total,
      active,
      inactive,
      byType,
    };
  }
}

export default new ResourceService();
