import { PrismaClient, Business, BusinessType, Prisma } from "@prisma/client";
import Database from "../config/database";

class BusinessRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getInstance();
  }

  async create(data: Prisma.BusinessCreateInput): Promise<Business> {
    return this.prisma.business.create({ data });
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
    data: Prisma.BusinessUpdateInput
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
        status: { notIn: ["DELETED", "SUSPENDED", "INACTIVE"] },
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
}

export default new BusinessRepository();
