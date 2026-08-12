import { Request, Response } from "express";
import businessService from "../services/business.service";
import { asyncHandler } from "../utils/asyncHandler";
import { BusinessType } from "@prisma/client";
import { InvalidInputError } from "../utils/errors";
import { paginatedResponse, successResponse } from "../utils/response";
import authClient from "../clients/auth.client";
import emailService from "../services/email.service";
import {
  CreateBusinessInput,
  UpdateBusinessInput,
} from "../types/business.types";

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

    return paginatedResponse(
      res,
      result.data, // array of businesses
      result.meta, // { total, page, limit, totalPages }
      "Businesses fetched successfully",
    );
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

    // Convert strings to actual Date objects
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Validate using the timestamp value
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

  //Get Available Slots for a (HOTEL )business
  checkAvailableSlots = asyncHandler(async (req: Request, res: Response) => {
    const { category, location, checkIn, checkOut } = req.body;

    //  Convert strings to actual Date objects
    const start = new Date(checkIn as string);
    const end = new Date(checkOut as string);

    //  Validate using the timestamp value
    if (start.getTime() >= end.getTime()) {
      throw new InvalidInputError("Start time must be before end time");
    }

    const slots = await businessService.getAvailableSlots(
      checkIn as string,
      checkOut as string,
      location as string,
      category as BusinessType,
    );

    const message = slots.length
      ? "Businesses fetched successfully"
      : "No businesses found in this location";
    console.log("Message:", message, "Slots:", slots);
    successResponse(res, { business: slots }, message);
  });

  // Get Available SALONS

  listSalons = asyncHandler(async (req: Request, res: Response) => {
    const { category, location } = req.body;
    console.log(
      "Controller received request for available salons with location:",
      location,
      "and category:",
      category,
    );
    const slots = await businessService.listSalons(
      location as string,
      category as BusinessType,
    );

    const message = slots.length
      ? "Salons fetched successfully"
      : "No salons found in this location";

    successResponse(res, { business: slots }, message);
  });
  //approveBusiness
  approveBusiness = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const user = await authClient.validateUser(req.user!.id);
    console.log("User info from Auth Service:", user);

    const business = await businessService.approveBusiness(id);

    await emailService.sendBusinessApprovalEmail(business.email, business.name);

    successResponse(res, null, "Business approved successfully");
  });

  // rejectBusiness
  rejectBusiness = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const user = await authClient.validateUser(req.user!.id);
    console.log("User info from Auth Service:", user);

    const { rejectionReasons, adminNote } = req.body;

    const business = await businessService.rejectBusiness(
      id,
      rejectionReasons,
      adminNote,
    );

    await authClient.updateUserStatus(business.ownerId, "REJECTED");

    await emailService.sendBusinessRejectionEmail(
      business.email,
      business.name,
      rejectionReasons,
      adminNote,
    );

    successResponse(res, null, "Business rejected successfully");
  });

  // set up business profile (for vendor) -- STEP 1
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user!.businessId as string;
    console.log("Business ID from request:", businessId);
    const business =
      await businessService.getBusinessWithSetupStatus(businessId);

    successResponse(res, business, "Business profile set up successfully");
  });

  // Mark step complete (for vendor)
  markStepComplete = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user!.businessId as string;
    const step = req.body.step;
    const business = await businessService.markStepComplete(businessId, step);
    successResponse(res, business, "Step marked as complete successfully");
  });
}
export default new BusinessController();
