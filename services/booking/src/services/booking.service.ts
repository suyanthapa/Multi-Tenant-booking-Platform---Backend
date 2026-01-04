import { Booking, BookingStatus } from "@prisma/client";
import { bookingRepository, resourceRepository } from "../repositories";
import {
  NotFoundError,
  BookingConflictError,
  InvalidBookingError,
} from "../utils/errors";

export interface CreateBookingDTO {
  userId: string;
  vendorId: string;
  resourceId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  vendorName: string;
  notes?: string;
}

export interface UpdateBookingDTO {
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  status?: BookingStatus;
  notes?: string;
}

export interface BookingQueryParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  userId?: string;
  vendorId?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
}

class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingDTO): Promise<Booking> {
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    const bookingDate = new Date(data.bookingDate);

    // Validate dates
    if (startTime >= endTime) {
      throw new InvalidBookingError("Start time must be before end time");
    }

    if (bookingDate < new Date()) {
      throw new InvalidBookingError("Booking date cannot be in the past");
    }

    // Fetch resource details
    const resource = await resourceRepository.findById(data.resourceId);
    if (!resource) {
      throw new NotFoundError("Resource not found");
    }

    // Check if resource is active
    if (!resource.isActive) {
      throw new InvalidBookingError("Resource is not available for booking");
    }

    // Check if resource belongs to the vendor
    if (resource.vendorId !== data.vendorId) {
      throw new InvalidBookingError("Resource does not belong to this vendor");
    }

    // Check if time slot is available
    const isAvailable = await bookingRepository.isTimeSlotAvailable(
      data.resourceId,
      startTime,
      endTime
    );

    if (!isAvailable) {
      throw new BookingConflictError(
        "This time slot is not available. Please choose another time."
      );
    }

    // Create booking with snapshot data
    const booking = await bookingRepository.create({
      userId: data.userId,
      vendorId: data.vendorId,
      resourceId: data.resourceId,
      bookingDate,
      startTime,
      endTime,
      resourceName: resource.name,
      resourceType: resource.type,
      vendorName: data.vendorName,
      priceAtBooking: resource.price,
      currency: resource.currency,
      status: BookingStatus.PENDING,
      notes: data.notes,
    });

    return booking;
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<Booking> {
    const booking = await bookingRepository.findById(id);

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    return booking;
  }

  /**
   * Get all bookings with filters and pagination
   */
  async getBookings(params: BookingQueryParams): Promise<{
    bookings: Booking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.vendorId) {
      where.vendorId = params.vendorId;
    }

    if (params.resourceId) {
      where.resourceId = params.resourceId;
    }

    if (params.startDate || params.endDate) {
      where.bookingDate = {};
      if (params.startDate) {
        where.bookingDate.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        where.bookingDate.lte = new Date(params.endDate);
      }
    }

    const [bookings, total] = await Promise.all([
      bookingRepository.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: "desc" },
      }),
      bookingRepository.count(where),
    ]);

    return {
      bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update booking
   */
  async updateBooking(id: string, data: UpdateBookingDTO): Promise<Booking> {
    const existingBooking = await this.getBookingById(id);

    // Check if booking can be updated
    if (
      existingBooking.status === BookingStatus.CANCELLED ||
      existingBooking.status === BookingStatus.COMPLETED
    ) {
      throw new InvalidBookingError(
        "Cannot update a cancelled or completed booking"
      );
    }

    const updateData: any = {};

    if (data.bookingDate) {
      updateData.bookingDate = new Date(data.bookingDate);
    }

    if (data.startTime && data.endTime) {
      const startTime = new Date(data.startTime);
      const endTime = new Date(data.endTime);

      if (startTime >= endTime) {
        throw new InvalidBookingError("Start time must be before end time");
      }

      // Check if new time slot is available
      const isAvailable = await bookingRepository.isTimeSlotAvailable(
        existingBooking.resourceId,
        startTime,
        endTime,
        id
      );

      if (!isAvailable) {
        throw new BookingConflictError(
          "This time slot is not available. Please choose another time."
        );
      }

      updateData.startTime = startTime;
      updateData.endTime = endTime;
    }

    if (data.status) {
      updateData.status = data.status;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    return bookingRepository.update(id, updateData);
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string, cancelReason: string): Promise<Booking> {
    const booking = await this.getBookingById(id);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new InvalidBookingError("Booking is already cancelled");
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new InvalidBookingError("Cannot cancel a completed booking");
    }

    return bookingRepository.cancel(id, cancelReason);
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    id: string,
    status: BookingStatus
  ): Promise<Booking> {
    await this.getBookingById(id);
    return bookingRepository.updateStatus(id, status);
  }

  /**
   * Get user bookings
   */
  async getUserBookings(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    bookings: Booking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      bookingRepository.findByUserId(userId, skip, limit),
      bookingRepository.count({ userId }),
    ]);

    return {
      bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get vendor bookings
   */
  async getVendorBookings(
    vendorId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    bookings: Booking[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      bookingRepository.findByVendorId(vendorId, skip, limit),
      bookingRepository.count({ vendorId }),
    ]);

    return {
      bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete booking (soft delete by setting status to cancelled)
   */
  async deleteBooking(id: string): Promise<Booking> {
    const booking = await this.getBookingById(id);

    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.CANCELLED
    ) {
      throw new InvalidBookingError(
        "Only pending or cancelled bookings can be deleted"
      );
    }

    return bookingRepository.delete(id);
  }
}

export default new BookingService();
