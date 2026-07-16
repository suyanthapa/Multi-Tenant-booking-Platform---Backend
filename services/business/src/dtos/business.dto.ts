import { BusinessType, RejectionReason } from "@prisma/client";
import { z } from "zod";

// Create Business Schema
export const createBusinessSchema = z.object({
  body: z.object({
    ownerId: z.string().min(1, "Owner ID is required"),
    name: z.string().min(1, "Business name is required"),
    description: z.string().optional(),
    type: z.nativeEnum(BusinessType),
    address: z.object({
      street: z.string().min(1, "Street is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().min(1, "State is required"),
      postalCode: z.string().min(1, "Postal code is required"),
      country: z.string().min(1, "Country is required"),
    }),
    phone: z.string().min(1, "Phone is required"),
    email: z.string().email("Invalid email address"),
  }),
});

// Update Business Schema
export const updateBusinessSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    type: z.nativeEnum(BusinessType).optional(),
    address: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

// Query Schema
export const queryBusinessSchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().max(50).optional().default("10"),
    type: z.nativeEnum(BusinessType).optional(),
    status: z.string().optional(),
    search: z.string().optional(),
  }),
});

//Pending Business Schema
export const getPendingBusinessesSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    type: z
      .enum(["HOTEL", "CLINIC", "SALON", "CO_WORKING", "OTHER"])
      .optional(),
    search: z.string().optional(),
  }),
});

// Reject Business Schema
export const rejectBusinessSchema = z.object({
  body: z.object({
    rejectionReasons: z
      .array(z.nativeEnum(RejectionReason))
      .min(1, "At least one rejection reason is required"),
    adminNote: z.string().min(1, "Admin note is required"),
  }),
});

// Check Availability Schema -- for hotels
export const checkAvailabilitySchema = z.object({
  body: z
    .object({
      category: z.nativeEnum(BusinessType, {
        errorMap: () => ({ message: "Invalid business category" }),
      }),

      location: z.string().min(1, "Location is required"),

      checkIn: z.coerce.date().refine((date) => date.getTime() >= Date.now(), {
        message: "Check-in date cannot be in the past",
      }),

      checkOut: z.coerce.date().refine((date) => date.getTime() > Date.now(), {
        message: "Check-out date cannot be in the past",
      }),
    })
    .refine((data) => data.checkOut > data.checkIn, {
      message: "Check-out date must be after check-in date",
      path: ["checkOut"],
    }),
});

// approve business schema
export const approveBusinessSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Business ID is required"),
  }),
});
