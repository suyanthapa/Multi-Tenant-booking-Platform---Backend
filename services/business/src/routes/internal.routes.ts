import { Router } from "express";
import BusinessInternalController from "../controllers/internal/business.internal";
import { internalAuthMiddleware } from "../middlewares/internalAuthMiddleware";
import businessController from "../controllers/business.controller";

const internalRoutes = Router();

// routes/internal.routes.ts
internalRoutes.get(
  "/:id/exists",
  internalAuthMiddleware, // Only other microservices CAN call this
  BusinessInternalController.checkExists,
);

internalRoutes.get(
  "/:id/validate",
  internalAuthMiddleware, // Only other microservices CAN call this
  BusinessInternalController.validateBusiness,
);

internalRoutes.get(
  "/user/:userId/business",
  internalAuthMiddleware, // Only other microservices CAN call this
  BusinessInternalController.validateBusinessByOwner,
);

internalRoutes.post("/search", businessController.getBusinesses);

internalRoutes.post("/create", BusinessInternalController.createBusiness);

export default internalRoutes;
