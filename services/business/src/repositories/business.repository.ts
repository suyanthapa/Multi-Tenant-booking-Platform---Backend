import {
  PrismaClient,
  Business,
  BusinessType,
  Prisma,
  RejectionReason,
} from "@prisma/client";
import Database from "../config/database";
import { toBusinessDTO } from "../mappers/business.mapper";
import { BusinessResponseDTO } from "../dto/business/response.dto";

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
    startDate: string,
    endDate: string,
    location?: string,
    type?: BusinessType,
  ): Promise<BusinessResponseDTO[]> {
    console.log(
      "Fetching available slots for location:",
      location,
      "and type:",
      type,
      "between",
      startDate,
      "and",
      endDate,
    );
    //get businesses
    const businesses = await this.prisma.business.findMany({
      where: {
        AND: [
          { status: "ACTIVE" },
          { isVerified: true },
          { type },
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
    });
    console.log("Businesses found:", businesses.length);
    return businesses.map((business) => toBusinessDTO(business));
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
}
export default new BusinessRepository();
