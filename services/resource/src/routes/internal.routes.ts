import { Router } from "express";
import { internalAuthMiddleware } from "../middlewares/internalAuthMiddleware";
import ResourceInternalController from "../controllers/internal/resource.internal";

const internalRoutes = Router();

// routes/internal.routes.ts
internalRoutes.post(
  "/:id/exists",
  internalAuthMiddleware, // Only other microservices CAN call this
  ResourceInternalController.checkExists
);

export default internalRoutes;
