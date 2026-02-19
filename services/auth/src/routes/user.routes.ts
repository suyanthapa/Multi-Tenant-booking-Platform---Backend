import { Router } from "express";
import authController from "../controllers/auth.controller";
import { validate } from "../middlewares/validator";
import { authenticate, authorize } from "../middlewares/auth";
import { UserRole } from "@prisma/client";
import { editUserSchema } from "../dtos/user.dto";

const userRouter = Router();

/**
 * @route  GET /auth/users
 * @desc   Get all users (Admin only)
 * @access Private
 */
userRouter.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  authController.getAllUsers,
);

/**
 * @route DELETE /auth/users/:userId
 * @desc  Delete user (Admin only)
 * @access Private
 */
userRouter.delete(
  "/:userId",
  authenticate,
  authorize(UserRole.ADMIN),
  authController.deleteUser,
);

/**
 * @route  PATCH /auth/users/:userId
 * @desc   Edit user (Admin only)
 * @access Private
 */
userRouter.patch(
  "/:userId",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(editUserSchema),
  authController.editUser,
);

export default userRouter;
