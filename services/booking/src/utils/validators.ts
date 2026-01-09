import { z } from "zod";

/**
 * Validation Schemas using Zod for Booking Service
 */

export const createBookingSchema = z.object({
  body: z.object({
    businessId: z.string().min(1, "Business ID is required"),
    businessName: z.string().min(1, "Business name is required"),
    resourceId: z.string().uuid("Invalid resource ID"),
    resourceName: z.string().min(1, "Resource name is required"),
    bookingDate: z.string().datetime("Invalid booking date"),
    startTime: z.string().datetime("Invalid start time"),
    endTime: z.string().datetime("Invalid end time"),
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
    resourceId: z.string().uuid("Invalid resource ID").optional(),
    startDate: z.string().datetime("Invalid start date").optional(),
    endDate: z.string().datetime("Invalid end date").optional(),
  }),
});

/**
 * Resource Validation Schemas
 */

export const createResourceSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Resource name is required"),
    type: z.enum(["HOTEL_ROOM", "DOCTOR_SLOT", "SALON_CHAIR", "DESK", "OTHER"]),
    description: z.string().optional(),
    price: z.coerce.number().positive("Price must be greater than zero"),
    currency: z.string().length(3, "Currency must be 3 characters").optional(),
  }),
});

export const updateResourceSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid resource ID"),
  }),
  body: z.object({
    name: z.string().min(1, "Resource name is required").optional(),
    type: z
      .enum(["HOTEL_ROOM", "DOCTOR_SLOT", "SALON_CHAIR", "DESK", "OTHER"])
      .optional(),
    description: z.string().optional(),
    price: z.coerce
      .number()
      .positive("Price must be greater than zero")
      .optional(),
    currency: z.string().length(3, "Currency must be 3 characters").optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getResourceByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid resource ID"),
  }),
});

export const getResourcesSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).max(100).optional().default(10),
    vendorId: z.string().uuid("Invalid vendor ID").optional(),
    type: z
      .enum(["HOTEL_ROOM", "DOCTOR_SLOT", "SALON_CHAIR", "DESK", "OTHER"])
      .optional(),
    isActive: z
      .string()
      .transform((val) => val === "true")
      .optional(),
    minPrice: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
  }),
});

export const getResourcesByVendorSchema = z.object({
  params: z.object({
    vendorId: z.string().uuid("Invalid vendor ID"),
  }),
  query: z.object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).max(100).optional().default(10),
    isActive: z.string().optional(),
  }),
});

export const getResourcesByTypeSchema = z.object({
  params: z.object({
    type: z.enum(["HOTEL_ROOM", "DOCTOR_SLOT", "SALON_CHAIR", "DESK", "OTHER"]),
  }),
  query: z.object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).max(100).optional().default(10),
    isActive: z.string().optional(),
  }),
});

export const bulkCreateResourcesSchema = z.object({
  body: z.object({
    resources: z.array(
      z.object({
        vendorId: z.string().uuid("Invalid vendor ID"),
        name: z.string().min(1, "Resource name is required"),
        type: z.enum([
          "HOTEL_ROOM",
          "DOCTOR_SLOT",
          "SALON_CHAIR",
          "DESK",
          "OTHER",
        ]),
        description: z.string().optional(),
        price: z.coerce.number().positive("Price must be greater than zero"),
        currency: z
          .string()
          .length(3, "Currency must be 3 characters")
          .optional(),
      })
    ),
  }),
});

export const getVendorResourceStatsSchema = z.object({
  params: z.object({
    vendorId: z.string().uuid("Invalid vendor ID"),
  }),
});

/**
 * Type Definitions
 * Extract types from schemas for use in controllers and services
 */

// Booking Types
export type CreateBookingInput = z.infer<typeof createBookingSchema>["body"];
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>["body"];
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>["body"];
export type GetBookingsInput = z.infer<typeof getBookingsSchema>["query"];

// Resource Types
export type CreateResourceInput = z.infer<typeof createResourceSchema>["body"];
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>["body"];
export type GetResourcesInput = z.infer<typeof getResourcesSchema>["query"];
export type GetResourcesByVendorInput = z.infer<
  typeof getResourcesByVendorSchema
>;
export type GetResourcesByTypeInput = z.infer<typeof getResourcesByTypeSchema>;
export type BulkCreateResourcesInput = z.infer<
  typeof bulkCreateResourcesSchema
>["body"];
export type GetVendorResourceStatsInput = z.infer<
  typeof getVendorResourceStatsSchema
>;
