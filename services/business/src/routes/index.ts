import { Router } from "express";
import businessRoutes from "./business.routes";
import internalRoutes from "./internal.routes";

const router = Router();

// Mount business routes
router.use("/businesses", businessRoutes);

// Mount internal routes
router.use("/internal/businesses", internalRoutes);

export default router;
