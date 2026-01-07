import { Router } from "express";
import BusinessInternalController from "../controllers/internal/business.internal";
import { internalAuthMiddleware } from "../middlewares/internalAuthMiddleware";

const internalRoutes = Router();

// routes/internal.routes.ts
internalRoutes.get(
  "/:id/exists",
  internalAuthMiddleware, // Only other microservices CAN call this
  BusinessInternalController.checkExists
);

export default internalRoutes;
