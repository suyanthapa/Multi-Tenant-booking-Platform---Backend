import { z } from "zod";
import { ResourceType, ResourceStatus } from "@prisma/client";

// Create Resource Schema
export const createResourceSchema = z.object({
  body: z.object({
    businessId: z.string().min(1, "Business ID is required"),
    name: z.string().min(1, "Resource name is required"),
    type: z.nativeEnum(ResourceType),
    description: z.string().optional().nullable(),
    price: z.number().positive("Price must be positive"),
  }),
});

// Update Resource Schema
export const updateResourceSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    type: z.nativeEnum(ResourceType).optional(),
    description: z.string().optional().nullable(),
    price: z.number().positive().optional(),
    currency: z.string().optional(),
    status: z.nativeEnum(ResourceStatus).optional(),
  }),
});

// Bulk Create Schema
export const bulkCreateResourceSchema = z.object({
  body: z.object({
    businessId: z.string().min(1),
    resources: z
      .array(
        z.object({
          name: z.string().min(1),
          type: z.nativeEnum(ResourceType),
          description: z.string().optional().nullable(),
          price: z.number().positive(),
          currency: z.string().default("USD"),
        })
      )
      .min(1, "At least one resource is required"),
  }),
});

// Query Schema
export const queryResourceSchema = z.object({
  query: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("10"),
    businessId: z.string().optional(),
    type: z.nativeEnum(ResourceType).optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
  }),
});

// Type exports
export type CreateResourceInput = z.infer<typeof createResourceSchema>["body"];
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>["body"];
export type BulkCreateResourceInput = z.infer<
  typeof bulkCreateResourceSchema
>["body"];
export type QueryResourceInput = z.infer<typeof queryResourceSchema>["query"];
