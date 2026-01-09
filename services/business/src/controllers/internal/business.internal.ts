import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import businessRepository from "../../repositories/business.repository";

class BusinessInternalController {
  checkExists = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const exists = await businessRepository.checkExists(id);

    // We return a simple flat object
    res.status(200).json({
      success: true,
      exists: exists,
    });
  });

  validateBusiness = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const business = await businessRepository.validateBusiness(id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found",
      });
    }
    res.status(200).json({
      success: true,
      businessInfo: {
        businessId: business.id,
        vendorId: business.ownerId,
        businessName: business.name,
        status: business.status,
      },
    });
  });
}

export default new BusinessInternalController();
