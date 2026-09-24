import {
  PrismaClient,
  Business,
  BusinessType,
  Prisma,
  RejectionReason,
} from "@prisma/client";
import Database from "../config/database";
// import { toBusinessDTO } from "../mappers/business.mapper";
import { BusinessResponse } from "../dto/business/response.dto";
import {
  CompletedSteps,
  SetupBasicsInput,
} from "../types/setup.business.types";

class BusinessRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getInstance();
  }

  async create(data: Prisma.BusinessCreateInput): Promise<Business> {
    return this.prisma.business.create({
      data: {
        ownerId: data.ownerId,
        name: data.name,
        description: data.description,
        type: data.type,
        address: data.address,
        phone: data.phone,
        email: data.email,
        isVerified: false,
        status: "PENDING",
      },
    });
  }

  async findById(id: string): Promise<Business | null> {
    return this.prisma.business.findUnique({
      where: { id },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.BusinessWhereInput;
    orderBy?: Prisma.BusinessOrderByWithRelationInput;
  }): Promise<Business[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.business.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async count(where?: Prisma.BusinessWhereInput): Promise<number> {
    return this.prisma.business.count({ where });
  }

  async update(
    id: string,
    data: Prisma.BusinessUpdateInput,
  ): Promise<Business> {
    return this.prisma.business.update({
      where: { id },
      data,
    });
  }

  async updateSetupBasics(
    businessId: string,
    data: SetupBasicsInput,
  ): Promise<void> {
    const { type, description, ...settingsData } = data;

    await this.prisma.$transaction(async (tx) => {
      await tx.business.update({
        where: { id: businessId },
        data: {
          type,
          description,
        },
      });

      await tx.businessSettings.upsert({
        where: { businessId },
        update: settingsData,
        create: {
          businessId,
          ...settingsData,
        },
      });
    });
  }

  async delete(id: string): Promise<Business> {
    return this.prisma.business.update({
      //soft dltete
      where: { id },
      data: { status: "DELETED" },
    });
  }

  async findByOwner(ownerId: string): Promise<Business | null> {
    return this.prisma.business.findUnique({
      where: {
        ownerId,
        // status: { notIn: ["DELETED", "SUSPENDED", "INACTIVE"] },
      },
    });
  }

  async findByType(type: BusinessType): Promise<Business[]> {
    return this.prisma.business.findMany({
      where: { type },
      orderBy: { createdAt: "desc" },
    });
  }

  async toggleStatus(id: string): Promise<Business> {
    const business = await this.findById(id);
    if (!business) {
      throw new Error("Business not found");
    }

    return this.prisma.business.update({
      where: { id },
      data: { status: "INACTIVE" },
    });
  }

  async verifyBusiness(id: string): Promise<Business> {
    return this.prisma.business.update({
      where: { id },
      data: { isVerified: true, status: "ACTIVE" },
    });
  }

  // for internal use to check existence
  async checkExists(id: string): Promise<boolean> {
    const count = await this.prisma.business.count({
      where: { id },
    });
    return count > 0; // Returns true/false instantly without loading data into RAM
  }

  async validateBusiness(id: string): Promise<Business | null> {
    const business = await this.prisma.business.findUnique({
      where: { id },
    });
    return business;
  }

  async getAvailableSlots(
    checkIn: string,
    checkOut: string,
    location?: string,
    category?: BusinessType,
    page = 1,
    limit = 10,
  ): Promise<{
    businesses: BusinessResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    console.log(
      "Fetching available slots for location:",
      location,
      "and category:",
      category,
      "between",
      checkIn,
      "and",
      checkOut,
    );
    //get businesses (include images so we can return cover image)
    const where: Prisma.BusinessWhereInput = {
      AND: [
        { status: "ACTIVE" },
        { isVerified: true },
        { type: category },
        {
          OR: [
            { address: { path: ["city"], equals: location } },
            {
              address: {
                path: ["state"],
                equals: location,
              },
            },
            { address: { path: ["country"], equals: location } },
          ],
        },
      ],
    };

    const [businesses, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          businessImages: {
            where: { isCover: true },
            take: 1,
          },
        },
      }),
      this.prisma.business.count({ where }),
    ]);

    console.log("Businesses found:", businesses.length);

    return {
      businesses: businesses.map((business) => ({
        id: business.id,
        name: business.name,
        address: business.address as BusinessResponse["address"],
        type: business.type,
        email: business.email,
        phone: business.phone || "",
        description: business.description ?? "",
        coverImageUrl: business.businessImages[0]?.url ?? "",
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // list salons
  async listSalons(
    location: string,
    category: BusinessType,
  ): Promise<BusinessResponse[]> {
    console.log(
      "Fetching available salons for location:",
      location,
      "and category:",
      category,
    );

    //get salons (include images so we can return cover image)
    const businesses = await this.prisma.business.findMany({
      where: {
        AND: [
          { status: "ACTIVE" },
          { isVerified: true },
          { type: category },
          {
            OR: [
              { address: { path: ["city"], equals: location } },
              {
                address: {
                  path: ["state"],
                  equals: location,
                },
              },
              { address: { path: ["country"], equals: location } },
            ],
          },
        ],
      },
      include: {
        businessImages: {
          where: { isCover: true },
          take: 1,
        },
      },
    });

    console.log("Businesses found:", businesses.length);

    return businesses.map((business) => ({
      id: business.id,
      name: business.name,
      address: business.address as BusinessResponse["address"],
      type: business.type,
      email: business.email,
      phone: business.phone || "",
      description: business.description ?? "",
      coverImageUrl: business.businessImages[0]?.url ?? "",
    }));
  }
  async approveBusiness(id: string): Promise<Business> {
    return this.prisma.business.update({
      where: { id },
      data: { status: "ACTIVE" },
    });
  }

  async rejectBusiness(
    id: string,
    rejectionReasons: RejectionReason[],
    adminNote: string,
  ): Promise<Business> {
    console.log("Rejecting business with ID:", id, "Admin notes:", adminNote);
    return this.prisma.business.update({
      where: { id },
      data: {
        adminNotes: adminNote, // Store as semicolon-separated string
        rejectionReasons: rejectionReasons, // Store as JSON array
        status: "REJECTED",
        rejectedAt: new Date(),
        resubmitted: false,
      },
    });
  }

  async markEmailVerified(userId: string, email: string): Promise<void> {
    await this.prisma.business.update({
      where: { ownerId: userId, email },
      data: { isVerified: true },
    });
  }

  async findByIdWithSettings(businessId: string) {
    return this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        businessSettings: true,
        _count: { select: { businessImages: true } },
      },
    });
  }

  async markStepComplete(
    businessId: string,
    completedSteps: CompletedSteps,
    isProfileComplete: boolean,
  ): Promise<void> {
    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        completedSteps,
        isProfileComplete,
      },
    });
  }

  async findByIdPublic(id: string) {
    return this.prisma.business.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        phone: true,
        email: true,
        address: true,
        status: true,
        approvedAt: true,
        createdAt: true,
        // settings — check-in/out or opening hours
        businessSettings: {
          select: {
            checkInTime: true,
            checkOutTime: true,
            openingHours: true,
            cancellationPolicy: true,
            cancellationWindowHours: true,
          },
        },
        // property images ordered by display order
        businessImages: {
          select: {
            id: true,
            url: true,
            isCover: true,
            order: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });
  }
}

// infer the type from the function itself -- it can now use business and businessSettings
export type BusinessWithSettings = NonNullable<
  Awaited<ReturnType<BusinessRepository["findByIdWithSettings"]>>
>;

export default new BusinessRepository();
