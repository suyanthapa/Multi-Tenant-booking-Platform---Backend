import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { proxy } from "../utils/proxy";
import { SERVICES } from "../config/service";

const router = Router();
router.use(authenticate);
router.use("/", proxy(SERVICES.BOOKING));
export default router;
