import { Business, BusinessType } from "@prisma/client";
import businessRepository from "../repositories/business.repository";
import { NotFoundError, AuthorizationError } from "../utils/errors";
import { CreateBusinessInput, UpdateBusinessInput } from "../utils/validators";

class BusinessService {
  async createBusiness(
    ownerId: string,
    data: CreateBusinessInput
  ): Promise<Business> {
    return businessRepository.create({
      ...data,
      ownerId,
    });
  }

  async getBusinessById(id: string): Promise<Business> {
    const business = await businessRepository.findById(id);
    if (!business) {
      throw new NotFoundError("Business not found");
    }
    return business;
  }

  async getAllBusinesses(params: {
    page?: number;
    limit?: number;
    type?: BusinessType;
    isActive?: boolean;
    search?: string;
  }): Promise<{
    businesses: Business[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.type) {
      where.type = params.type;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [businesses, total] = await Promise.all([
      businessRepository.findAll({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
      }),
      businessRepository.count(where),
    ]);

    return {
      businesses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBusinessesByOwner(ownerId: string): Promise<Business[]> {
    return businessRepository.findByOwner(ownerId);
  }

  async getBusinessesByType(type: BusinessType): Promise<Business[]> {
    // 1. Normalize the input
    const normalizedType = type.toUpperCase() as BusinessType;

    // 2. Validate it exists in your Enum to prevent Prisma errors
    if (!Object.values(BusinessType).includes(normalizedType)) {
      throw new NotFoundError(`Business type '${type}' not found`);
    }
    return businessRepository.findByType(normalizedType);
  }

  async updateBusiness(
    id: string,
    userId: string,
    userRole: string,
    data: UpdateBusinessInput
  ): Promise<Business> {
    const business = await this.getBusinessById(id);

    // Only owner or admin can update
    if (business.ownerId !== userId && userRole !== "ADMIN") {
      throw new AuthorizationError(
        "You don't have permission to update this business"
      );
    }

    return businessRepository.update(id, data);
  }

  async deleteBusiness(
    id: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const business = await this.getBusinessById(id);

    // Only owner or admin can delete
    if (business.ownerId !== userId && userRole !== "ADMIN") {
      throw new AuthorizationError(
        "You don't have permission to delete this business"
      );
    }

    await businessRepository.delete(id);
  }

  async toggleBusinessStatus(
    id: string,
    userId: string,
    userRole: string
  ): Promise<Business> {
    const business = await this.getBusinessById(id);

    // Only owner or admin can toggle status
    if (business.ownerId !== userId && userRole !== "ADMIN") {
      throw new AuthorizationError(
        "You don't have permission to modify this business"
      );
    }

    return businessRepository.toggleStatus(id);
  }
}

export default new BusinessService();
