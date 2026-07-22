import { Request, Response } from "express";
import businessService from "../services/business.service";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/response";
import { SetupBasicsInput } from "../types/setup.business.types";

class SetupBusinessController {
  // set up business profile  -- STEP 1
  setupBasics = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user!.businessId as string;
    const data: SetupBasicsInput = req.body;

    await businessService.setupBasics(businessId, data);

    successResponse(res, null, "Business profile set up successfully");
  });
}
export default new SetupBusinessController();
