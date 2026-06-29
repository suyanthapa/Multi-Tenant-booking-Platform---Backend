import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import authService from "../../services/auth.service";
import { UserStatus } from "@prisma/client";
import { NotFoundError } from "../../utils/errors";

class AuthInternalController {
  validateUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const userExists = await authService.validateUser(userId);
    if (!userExists) {
      throw new NotFoundError("User not found");
    }
    res.status(200).json({
      success: true,
    });
  });

  updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { status } = req.body as { status: UserStatus };
    console.log("hittteddd here");
    console.log(
      "Updating user status for userId:",
      userId,
      "to status:",
      status,
    );
    await authService.updateUserStatus(userId, status);

    res.status(200).json({
      success: true,
    });
  });
}
export default new AuthInternalController();
