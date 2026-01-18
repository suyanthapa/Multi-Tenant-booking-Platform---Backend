import { Router } from "express";
import resourceRoutes from "./resource.routes";
import categoryRoutes from "./category.routes";
import internalRoutes from "./internal.routes";

const router = Router();

router.use("/resources", resourceRoutes);
router.use("/categories", categoryRoutes);

// Mount internal routes
router.use("/internal/resources", internalRoutes);

export default router;
