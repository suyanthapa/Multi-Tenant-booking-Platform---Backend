import { z } from "zod";
import {
  deleteUserSchema,
  editUserSchema,
  getAllUsersSchema,
} from "../dtos/user.dto";

export type UserRole = "CUSTOMER" | "VENDOR" | "ADMIN";
export type GetAllUsersInput = z.infer<typeof getAllUsersSchema>["query"];
export type EditUserInput = z.infer<typeof editUserSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
