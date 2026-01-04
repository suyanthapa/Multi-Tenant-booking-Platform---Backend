import { z } from "zod";
import { BusinessType } from "@prisma/client";

// Create Business Schema
export const createBusinessSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Business name is required"),
    description: z.string().optional(),
    type: z.nativeEnum(BusinessType),
    address: z.string().min(1, "Address is required"),
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
    limit: z.string().optional().default("10"),
    type: z.nativeEnum(BusinessType).optional(),
    isActive: z.string().optional(),
    search: z.string().optional(),
  }),
});

// Type exports
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>["body"];
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>["body"];
export type QueryBusinessInput = z.infer<typeof queryBusinessSchema>["query"];
