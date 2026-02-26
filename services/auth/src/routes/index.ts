import { Router } from "express";
import authRouter from "./auth.routes";
import userRouter from "./user.routes";
import internalRoutes from "./internal.routes";

const router = Router();

// Mount routes
router.use("/auth", authRouter);

//for ser management
router.use("/auth/users", userRouter);

router.use("/internal", internalRoutes);

export default router;
