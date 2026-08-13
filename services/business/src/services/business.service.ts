import { Business, BusinessType, RejectionReason } from "@prisma/client";
import businessRepository, {
  BusinessWithSettings,
} from "../repositories/business.repository";
import {
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from "../utils/errors";

import {
  BusinessResponse,
  BusinessSearchResponse,
} from "../dto/business/response.dto";
import { PaginatedMeta } from "../types/common.types";
import {
  CreateBusinessInput,
  UpdateBusinessInput,
} from "../types/business.types";
import {
  CompletedSteps,
  SetupBasicsInput,
} from "../types/setup.business.types";
import resourceClient from "../clients/resource.client";

class BusinessService {
  private async attachBusinessPrices(
    businesses: BusinessResponse[],
  ): Promise<BusinessResponse[]> {
    if (!businesses.length) {
      return businesses;
    }

    const businessIds = [...new Set(businesses.map((business) => business.id))];
    const lowestPrices =
      await resourceClient.getBatchBusinessLowestPrices(businessIds);

    return businesses.map((business) => ({
      ...business,
      price: lowestPrices[business.id] ?? null,
    }));
  }

  async createBusiness(data: CreateBusinessInput): Promise<Business> {
    console.log("Creating business with data:", data);
    // Check if vendor already has a business
    const existingBusiness = await businessRepository.findByOwner(data.ownerId);
    if (existingBusiness) {
      throw new ConflictError(
        "You already have a business. A vendor can only own one business.",
      );
    }
    const response = await businessRepository.create(data);
    console.log("Result", response);
    return response;
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
    data: Business[];
    meta: PaginatedMeta;
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
      data: businesses,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
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
    data: UpdateBusinessInput,
  ): Promise<Business> {
    const business = await this.getBusinessById(id);

    // Only owner or admin can update
    if (business.ownerId !== userId && userRole !== "ADMIN") {
      throw new AuthorizationError(
        "You don't have permission to update this business",
      );
    }

    return businessRepository.update(id, data);
  }

  async deleteBusiness(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    const business = await this.getBusinessById(id);

    // Only owner or admin can delete
    if (business.ownerId !== userId && userRole !== "ADMIN") {
      throw new AuthorizationError(
        "You don't have permission to delete this business",
      );
    }

    await businessRepository.delete(id);
  }

  async toggleBusinessStatus(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<Business> {
    const business = await this.getBusinessById(id);

    // Only owner or admin can toggle status
    if (business.ownerId !== userId && userRole !== "ADMIN") {
      throw new AuthorizationError(
        "You don't have permission to modify this business",
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
        "You don't have permission to modify this business",
      );
    }

    return businessRepository.verifyBusiness(id);
  }

  async getAvailableSlots(
    checkIn: string,
    checkOut: string,
    location?: string,
    category?: BusinessType,
  ): Promise<BusinessSearchResponse[]> {
    console.log(
      "Service received request for available slots with location:",
      location,
      "and category:",
      category,
    );
    const result = await businessRepository.getAvailableSlots(
      checkIn,
      checkOut,
      location,
      category,
    );

    const lowestPrices = await resourceClient.getBatchBusinessLowestPrices(
      result.map((business) => business.id),
    );

    console.log("Available slots returned by repository:", result);

    return result.map((business) => ({
      ...business,
      price: lowestPrices[business.id] ?? null,
    }));
  }
  //GET THE LIST OF SALON BUSINESS
  async listSalons(
    location: string,
    category: BusinessType,
  ): Promise<BusinessResponse[]> {
    console.log(
      "Service received request for available slots with location:",
      location,
      "and category:",
      category,
    );
    const result = await businessRepository.listSalons(location, category);

    return this.attachBusinessPrices(result);
  }

  async approveBusiness(id: string): Promise<Business> {
    const business = await this.getBusinessById(id);
    if (!business) {
      throw new NotFoundError("Business not found");
    }
    return businessRepository.approveBusiness(id);
  }

  async rejectBusiness(
    id: string,
    rejectionReasons: RejectionReason[],
    adminNote: string,
  ): Promise<Business> {
    const business = await this.getBusinessById(id);
    if (!business) {
      throw new NotFoundError("Business not found");
    }
    return businessRepository.rejectBusiness(id, rejectionReasons, adminNote);
  }

  async markEmailVerified(userId: string, email: string): Promise<void> {
    await businessRepository.markEmailVerified(userId, email);
  }

  async getBusinessWithSetupStatus(businessId: string) {
    const business = await businessRepository.findByIdWithSettings(businessId);

    if (!business) throw new NotFoundError("Business not found");

    const setupStatus = this.getSetupStatus(business);

    return { business, setupStatus };
  }

  getSetupStatus(business: BusinessWithSettings) {
    const completed: CompletedSteps =
      (business.completedSteps as CompletedSteps) ?? {
        basicInfo: false,
        categories: false,
        images: false,
      };

    const currentStep = !completed.basicInfo
      ? 1
      : !completed.categories
        ? 2
        : !completed.images
          ? 3
          : 4;

    return {
      isProfileComplete: business.isProfileComplete,

      steps: completed,

      currentStep,
    };
  }

  async setupBasics(businessId: string, data: SetupBasicsInput): Promise<void> {
    const business = await this.getBusinessById(businessId);
    if (!business) {
      throw new NotFoundError("Business not found");
    }

    await businessRepository.updateSetupBasics(businessId, data);
  }

  async markStepComplete(
    businessId: string,
    step: keyof CompletedSteps,
  ): Promise<void> {
    const business = await businessRepository.findById(businessId);

    if (!business) {
      throw new NotFoundError("Business not found");
    }

    const completedSteps = (business.completedSteps as CompletedSteps) ?? {
      basicInfo: false,
      contact: false,
      images: false,
    };

    completedSteps[step] = true;

    const isProfileComplete =
      completedSteps.basicInfo &&
      completedSteps.categories &&
      completedSteps.images;

    await businessRepository.markStepComplete(
      businessId,
      completedSteps,
      isProfileComplete,
    );
  }
}
export default new BusinessService();
