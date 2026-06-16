import { Router } from "express";
import { internalAuthMiddleware } from "../middlewares/internalAuthMiddleware";
import authInternal from "../controllers/internal/auth.internal";

const internalRoutes = Router();

internalRoutes.get(
  "/:userId/validate",
  internalAuthMiddleware, // Only other microservices CAN call this
  authInternal.validateUser,
);

internalRoutes.patch(
  "/:userId/status",
  internalAuthMiddleware,
  authInternal.updateUserStatus,
);

export default internalRoutes;
