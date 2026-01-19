import { Router } from "express";
import resourceRoutes from "./resource.routes";
import internalRoutes from "./internal.routes";
import categoryRoutes from "./category.routes";

const router = Router();

router.use("/resources", resourceRoutes);

// Mount internal routes
router.use("/internal/resources", internalRoutes);

router.use("/resources/category", categoryRoutes);
export default router;
