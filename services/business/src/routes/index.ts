import { Router } from "express";
import businessRoutes from "./business.routes";

const router = Router();

router.use("/businesses", businessRoutes);

export default router;
