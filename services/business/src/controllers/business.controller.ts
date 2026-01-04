import { Request, Response } from "express";
import businessService from "../services/business.service";
import { asyncHandler } from "../utils/asyncHandler";
import { CreateBusinessInput, UpdateBusinessInput } from "../utils/validators";
import { BusinessStatus, BusinessType } from "@prisma/client";

class BusinessController {
  // Create business
  createBusiness = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateBusinessInput = req.body;
    const ownerId = req.user!.id;

    const business = await businessService.createBusiness(ownerId, data);

    res.status(201).json({
      success: true,
      data: business,
    });
  });

  // Get all businesses
  getAllBusinesses = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as any;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const type = query.type as BusinessType | undefined;

    // Admin can see all businesses, others only see active ones
    const userRole = req.user?.role;
    let status: BusinessStatus | undefined = query.status;
    // 2. Apply Security Logic
    if (userRole !== "ADMIN") {
      // Regular users and guests can ONLY see Active businesses
      status = BusinessStatus.ACTIVE;
    } else {
      // Admins can see a specific status if requested, otherwise show all except DELETED by default
      status = status || undefined;
    }
    const search = query.search;

    const result = await businessService.getAllBusinesses({
      page,
      limit,
      type,
      status,
      search,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  // Get business by ID
  getBusinessById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const business = await businessService.getBusinessById(id);

    res.status(200).json({
      success: true,
      data: business,
    });
  });

  // Get businesses by owner
  getBusinessesByOwner = asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.user!.id;

    const businesses = await businessService.getBusinessesByOwner(ownerId);

    res.status(200).json({
      success: true,
      data: businesses,
    });
  });

  // Get businesses by type
  getBusinessesByType = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;

    const businesses = await businessService.getBusinessesByType(
      type as BusinessType
    );

    res.status(200).json({
      success: true,
      data: businesses,
    });
  });

  // Update business
  updateBusiness = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data: UpdateBusinessInput = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const business = await businessService.updateBusiness(
      id,
      userId,
      userRole,
      data
    );

    res.status(200).json({
      success: true,
      data: business,
    });
  });

  // Delete business
  deleteBusiness = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    await businessService.deleteBusiness(id, userId, userRole);

    res.status(200).json({
      success: true,
      message: "Business deleted successfully",
    });
  });

  // Toggle business status
  toggleBusinessStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const business = await businessService.toggleBusinessStatus(
      id,
      userId,
      userRole
    );

    res.status(200).json({
      success: true,
      data: business,
    });
  });
}

export default new BusinessController();
