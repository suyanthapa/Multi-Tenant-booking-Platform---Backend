import { z } from "zod";

/**
 * Validation Schemas using Zod for Booking Service
 */

export const createBookingSchema = z.object({
  body: z.object({
    userId: z.string().uuid("Invalid user ID"),
    vendorId: z.string().uuid("Invalid vendor ID"),
    serviceId: z.string().uuid("Invalid service ID"),
    bookingDate: z.string().datetime("Invalid booking date"),
    startTime: z.string().datetime("Invalid start time"),
    endTime: z.string().datetime("Invalid end time"),
    notes: z.string().optional(),
  }),
});

export const updateBookingSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid booking ID"),
  }),
  body: z.object({
    bookingDate: z.string().datetime("Invalid booking date").optional(),
    startTime: z.string().datetime("Invalid start time").optional(),
    endTime: z.string().datetime("Invalid end time").optional(),
    status: z
      .enum([
        "PENDING",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ])
      .optional(),
    notes: z.string().optional(),
  }),
});

export const cancelBookingSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid booking ID"),
  }),
  body: z.object({
    cancelReason: z.string().min(1, "Cancel reason is required"),
  }),
});

export const getBookingByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid booking ID"),
  }),
});

export const getBookingsSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).max(100).optional().default(10),
    status: z
      .enum([
        "PENDING",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ])
      .optional(),
    userId: z.string().uuid("Invalid user ID").optional(),
    vendorId: z.string().uuid("Invalid vendor ID").optional(),
    serviceId: z.string().uuid("Invalid service ID").optional(),
    startDate: z.string().datetime("Invalid start date").optional(),
    endDate: z.string().datetime("Invalid end date").optional(),
  }),
});

export const updatePaymentStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid booking ID"),
  }),
  body: z.object({
    paymentStatus: z.enum(["PENDING", "PAID", "REFUNDED", "FAILED"]),
  }),
});
