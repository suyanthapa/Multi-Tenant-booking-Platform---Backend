import { Router } from "express";
import businessRoutes from "./business.routes";
import internalRoutes from "./internal.routes";
import adminRoutes from "./admin.business.routes";
import imageRoutes from "./image.business.routes";

const router = Router();

// Business Image Routes
router.use("/businesses/images", imageRoutes);

// Mount business routes
router.use("/businesses", businessRoutes);

router.use("/admin/businesses", adminRoutes);

// Mount internal routes
router.use("/internal/businesses", internalRoutes);

export default router;
