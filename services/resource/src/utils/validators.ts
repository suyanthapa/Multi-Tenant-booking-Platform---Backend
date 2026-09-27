import { z } from "zod";
import { ResourceType, ResourceStatus } from "@prisma/client";

// Create Resource Schema
export const createResourceSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Resource name is required"),
      type: z.nativeEnum(ResourceType),
      floor: z.string().optional().nullable(),
      categoryId: z.string().uuid("Invalid Category ID format").optional(),
    })
    .strict(),
});

// Update Resource Schema
export const updateResourceSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Resource ID format"),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    type: z.nativeEnum(ResourceType).optional(),
    floor: z.string().optional().nullable(),
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
          floor: z.string().optional().nullable(),
        }),
      )
      .min(1, "At least one resource is required"),
  }),
});

// Query Schema
export const queryResourceCategorySchema = z.object({
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

//type schema
export const typeResourceSchema = z.object({
  params: z.object({
    type: z.preprocess(
      (val) => (typeof val === "string" ? val.trim().toUpperCase() : val),
      z.nativeEnum(ResourceType, {
        errorMap: () => ({
          message: "Please select a valid Resource Type ",
        }),
      }),
    ),
  }),
});

//create respurce category schema
export const createCategorySchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Category name is required"),
      description: z.string().optional().nullable(),
      price: z.number().positive("Price must be positive"),
      currency: z.string().min(1).default("USD"),
      maxGuests: z.number().int().positive().optional().nullable(),
      amenities: z.array(z.string()).default([]),
      durationMinutes: z.number().int().positive().optional().nullable(),
      specialization: z.string().optional().nullable(),
    })
    .strict(),
});

//update category schema
export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid Category ID format"),
  }),
  body: z
    .object({
      name: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      price: z.number().positive().optional(),
      currency: z.string().min(1).optional(),
      maxGuests: z.number().int().positive().optional().nullable(),
      amenities: z.array(z.string()).optional(),
      durationMinutes: z.number().int().positive().optional().nullable(),
      specialization: z.string().optional().nullable(),
    })
    .strict(),
});

// Type exports
export type CreateResourceInput = z.infer<typeof createResourceSchema>["body"];
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>["body"];
export type BulkCreateResourceInput = z.infer<
  typeof bulkCreateResourceSchema
>["body"];
export type QueryResourceCategoryInput = z.infer<
  typeof queryResourceCategorySchema
>["query"];
export type TypeResourceInput = z.infer<typeof typeResourceSchema>["params"];
export type CreateCategoryInput = z.infer<typeof createCategorySchema>["body"];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>["body"];
