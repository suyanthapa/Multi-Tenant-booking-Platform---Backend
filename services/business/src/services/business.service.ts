import { Business, BusinessType } from "@prisma/client";
import businessRepository from "../repositories/business.repository";
import {
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from "../utils/errors";
import { CreateBusinessInput, UpdateBusinessInput } from "../utils/validators";

class BusinessService {
  async createBusiness(
    ownerId: string,
    data: CreateBusinessInput
  ): Promise<Business> {
    // Check if vendor already has a business
    const existingBusiness = await businessRepository.findByOwner(ownerId);
    if (existingBusiness) {
      throw new ConflictError(
        "You already have a business. A vendor can only own one business."
      );
    }

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
    status?: string;
    search?: string;
    userRole: string;
  }): Promise<{
    businesses: Business[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;

    const userRole = params.userRole;
    const status = params.status?.toUpperCase();

    const MAX_LIMIT = 50;
    const safeLimit = Math.min(limit, MAX_LIMIT);
    const skip = (page - 1) * safeLimit;

    console.log("User Role from service:", userRole);

    const where: any = {
      type: params.type,
      search: params.search,
    };
    // ROLE-BASED LOGIC
    if (userRole === "ADMIN") {
      // Admins can see specific status if requested, otherwise show all but DELETED
      if (status) {
        where.status = status;
      } else {
        where.status = "ACTIVE"; // Default to ACTIVE if no status provided
      }
    } else {
      // VENDORS and USERS can ONLY see ACTIVE businesses
      // Even if they try to pass ?status=DELETED in the URL, this overrides it
      where.status = "ACTIVE";
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

  async getBusinessesByOwner(ownerId: string): Promise<Business | null> {
    const business = await businessRepository.findByOwner(ownerId);

    return business;
  }

  async getBusinessesByType(type: BusinessType): Promise<Business[]> {
    //  Normalize the input
    const normalizedType = type.toUpperCase() as BusinessType;

    //  Validate it exists in  Enum to prevent Prisma errors
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

  async verifyBusiness(id: string, userRole: string): Promise<Business> {
    const business = await this.getBusinessById(id);

    if (!business) {
      throw new NotFoundError("Business not found");
    }
    // Only owner or admin can toggle status
    if (userRole !== "ADMIN") {
      throw new AuthorizationError(
        "You don't have permission to modify this business"
      );
    }

    return businessRepository.verifyBusiness(id);
  }
}

export default new BusinessService();
