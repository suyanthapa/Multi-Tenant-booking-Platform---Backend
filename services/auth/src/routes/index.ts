import { Router } from "express";
import authRouter from "./auth.routes";
import userRouter from "./user.routes";

const router = Router();

// Mount routes
router.use("/auth", authRouter);

//for ser management
router.use("/auth/users", userRouter);

export default router;
