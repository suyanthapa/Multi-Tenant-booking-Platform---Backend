import { z } from "zod";
import {
  createBusinessSchema,
  queryBusinessSchema,
  updateBusinessSchema,
  rejectBusinessSchema,
  getPendingBusinessesSchema,
} from "../dtos/business.dto";

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>["body"];
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>["body"];
export type QueryBusinessInput = z.infer<typeof queryBusinessSchema>["query"];
export type GetPendingBusinessesInput = z.infer<
  typeof getPendingBusinessesSchema
>["query"];
export type RejectBusinessInput = z.infer<typeof rejectBusinessSchema>["body"];
