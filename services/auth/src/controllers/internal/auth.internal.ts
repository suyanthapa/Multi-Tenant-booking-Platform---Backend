import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import authService from "../../services/auth.service";

class AuthInternalController {
  validateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const business = await authService.validateUser(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
    });
  });
}
export default new AuthInternalController();
