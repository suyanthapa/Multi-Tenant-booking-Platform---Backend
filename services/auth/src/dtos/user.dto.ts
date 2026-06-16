import { z } from "zod";

export const getAllUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(0).optional().default(10),
    role: z.enum(["CUSTOMER", "VENDOR", "ADMIN"]).optional(),
    status: z
      .enum([
        "ACTIVE",
        "PENDING_VERIFICATION",
        "DELETED",
        "SUSPENDED",
        "REJECTED",
      ])
      .optional(),
  }),
});

export const editUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid("Invalid User ID format"),
  }),
  body: z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username format invalid")
      .optional(),
    firstName: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({
    userId: z.string().uuid("Invalid User ID format"),
  }),
});
