import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import authService from "../../services/auth.service";

class AuthInternalController {
  validateUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    await authService.validateUser(userId);

    res.status(200).json({
      success: true,
    });
  });
}
export default new AuthInternalController();
