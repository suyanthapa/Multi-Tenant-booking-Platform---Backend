import { Booking, BookingStatus, Prisma } from "@prisma/client";
import Database from "../config/database";

export class BookingRepository {
  private prisma = Database.getInstance();

  /**
   * Create a new booking
   */
  async create(data: Prisma.BookingCreateInput): Promise<Booking> {
    return this.prisma.booking.create({
      data,
    });
  }

  /**
   * Find booking by ID
   */
  async findById(id: string): Promise<Booking | null> {
    return this.prisma.booking.findUnique({
      where: { id },
    });
  }

  /**
   * Find all bookings with filters
   */
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.BookingWhereInput;
    orderBy?: Prisma.BookingOrderByWithRelationInput;
  }): Promise<Booking[]> {
    return this.prisma.booking.findMany(params);
  }

  /**
   * Count bookings with filters
   */
  async count(where?: Prisma.BookingWhereInput): Promise<number> {
    return this.prisma.booking.count({ where });
  }

  /**
   * Update booking by ID
   */
  async update(id: string, data: Prisma.BookingUpdateInput): Promise<Booking> {
    return this.prisma.booking.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete booking by ID
   */
  async delete(id: string): Promise<Booking> {
    return this.prisma.booking.delete({
      where: { id },
    });
  }

  /**
   * Find bookings by user ID
   */
  async findByUserId(
    userId: string,
    skip?: number,
    take?: number
  ): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find bookings by vendor ID
   */
  async findByVendorId(
    vendorId: string,
    skip?: number,
    take?: number
  ): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: { vendorId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find bookings by resource ID
   */
  async findByResourceId(
    resourceId: string,
    skip?: number,
    take?: number
  ): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: { resourceId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find bookings by status
   */
  async findByStatus(
    status: BookingStatus,
    skip?: number,
    take?: number
  ): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: { status },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Check if time slot is available for a specific resource
   */
  async isTimeSlotAvailable(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    const where: Prisma.BookingWhereInput = {
      resourceId,
      status: {
        in: [
          BookingStatus.PENDING,
          BookingStatus.CONFIRMED,
          BookingStatus.IN_PROGRESS,
        ],
      },
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } },
          ],
        },
        {
          AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
    };

    if (excludeBookingId) {
      where.id = { not: excludeBookingId };
    }

    const conflictingBookings = await this.prisma.booking.count({ where });
    return conflictingBookings === 0;
  }

  /**
   * Update booking status
   */
  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    return this.prisma.booking.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Cancel booking
   */
  async cancel(id: string, cancelReason: string): Promise<Booking> {
    return this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason,
      },
    });
  }
}

export default new BookingRepository();
