import { Router } from "express";

import { proxy } from "../utils/proxy";
import { SERVICES } from "../config/service";

const router = Router();

router.use("/", proxy(SERVICES.BOOKING, "/api/bookings"));
export default router;
