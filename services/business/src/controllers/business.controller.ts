import { Request, Response } from "express";
import businessService from "../services/business.service";
import { asyncHandler } from "../utils/asyncHandler";
import { CreateBusinessInput, UpdateBusinessInput } from "../utils/validators";
import { BusinessType } from "@prisma/client";
import { InvalidInputError } from "../utils/errors";
import { successResponse } from "../utils/response";

class BusinessController {
  // Create business
  createBusiness = asyncHandler(async (req: Request, res: Response) => {
    const data: CreateBusinessInput = req.body;

    const business = await businessService.createBusiness(data);

    successResponse(res, business, "Business created successfully", 201);
  });

  // Get all businesses
  getAllBusinesses = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as any;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const type = query.type as BusinessType | undefined;
    const userRole = req.user?.role || "user";

    console.log("User Role from controller:", userRole);

    const search = req.query.search as string;
    const status = req.query.status as string;

    const result = await businessService.getAllBusinesses({
      page,
      limit,
      type,
      status,
      search,
      userRole,
    });

    successResponse(res, result);
  });

  // Get business by ID
  getBusinessById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const business = await businessService.getBusinessById(id);

    successResponse(res, business);
  });

  // Get businesses by owner
  getBusinessesByOwner = asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.user?.id as string;

    const business = await businessService.getBusinessesByOwner(ownerId);

    successResponse(res, business);
  });

  // Get businesses by type
  getBusinessesByType = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;

    const businesses = await businessService.getBusinessesByType(
      type as BusinessType,
    );

    successResponse(res, businesses);
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
      data,
    );

    successResponse(res, business, "Business updated successfully");
  });

  // Delete business
  deleteBusiness = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    await businessService.deleteBusiness(id, userId, userRole);

    successResponse(res, null, "Business deleted successfully");
  });

  // Toggle business status
  toggleBusinessStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const business = await businessService.toggleBusinessStatus(
      id,
      userId,
      userRole,
    );

    successResponse(res, business, "Business status updated successfully");
  });

  // Verify a business
  verifyBusiness = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userRole = req.user!.role;

    await businessService.verifyBusiness(id, userRole);

    successResponse(res, null, "Business verified successfully");
  });

  //Get Businesses
  getBusinesses = asyncHandler(async (req: Request, res: Response) => {
    const { location, startDate, endDate } = req.body;

    // 1. Convert strings to actual Date objects
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // 2. Validate using the timestamp value
    if (start.getTime() >= end.getTime()) {
      throw new InvalidInputError("Start time must be before end time");
    }
    const slots = await businessService.getAvailableSlots(
      startDate as string,
      endDate as string,
      location as string,
    );
    successResponse(res, { business: slots });
  });

  //Get Available Slots for a business
  checkAvailableSlots = asyncHandler(async (req: Request, res: Response) => {
    const { location, startDate, endDate } = req.body;

    // 1. Convert strings to actual Date objects
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // 2. Validate using the timestamp value
    if (start.getTime() >= end.getTime()) {
      throw new InvalidInputError("Start time must be before end time");
    }
    const slots = await businessService.getAvailableSlots(
      startDate as string,
      endDate as string,
      location as string,
    );
    successResponse(res, { business: slots });
  });
}
export default new BusinessController();
