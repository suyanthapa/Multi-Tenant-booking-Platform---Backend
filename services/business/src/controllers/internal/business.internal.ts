import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import businessRepository from "../../repositories/business.repository";
import { BusinessType } from "@prisma/client";
import businessService from "../../services/business.service";

interface BusinessAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
interface createBusinessData {
  ownerId: string;
  name: string;
  description: string;
  type: BusinessType;
  address: BusinessAddress;
  phone: string;
  email: string;
}
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

  validateBusinessByOwner = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId } = req.params;

      const business = await businessRepository.findByOwner(userId);

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
    },
  );

  createBusiness = asyncHandler(async (req: Request, res: Response) => {
    const data: createBusinessData = req.body;
    console.log("Received create business request with data:", data);
    const business = await businessService.createBusiness(data);

    res.status(201).json({
      success: true,
      data: business,
    });
  });
}
export default new BusinessInternalController();
