import { Router } from "express";
import resourceRoutes from "./resource.routes";
import internalRoutes from "./internal.routes";

const router = Router();

router.use("/resources", resourceRoutes);

// Mount internal routes
router.use("/internal/resources", internalRoutes);

export default router;
