import { Request, Response } from "express";
import resourceService from "../services/resource.service";
import { ResourceType } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler";
import {
  CreateResourceInput,
  UpdateResourceInput,
  BulkCreateResourcesInput,
} from "../utils/validators";

class ResourceController {
  /**
   * Create a new resource
   * POST /api/resources
   */
  createResource = asyncHandler(async (req: Request, res: Response) => {
    const vendorId = req.user?.id as string;
    const input: CreateResourceInput = req.body;
    const resource = await resourceService.createResource({
      ...input,
      vendorId,
    });

    res.status(201).json({
      success: true,
      data: resource,
    });
  });

  /**
   * Get all resources with filters
   * GET /api/resources
   */
  getResources = asyncHandler(async (req: Request, res: Response) => {
    const result = await resourceService.getResources(req.query as any);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get resource by ID
   * GET /api/resources/:id
   */
  getResourceById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const resource = await resourceService.getResourceById(id);

    res.status(200).json({
      success: true,
      data: resource,
    });
  });

  /**
   * Update resource
   * PATCH /api/resources/:id
   */
  updateResource = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const input: UpdateResourceInput = req.body;
    const resource = await resourceService.updateResource(id, input);

    res.status(200).json({
      success: true,
      data: resource,
    });
  });

  /**
   * Delete resource
   * DELETE /api/resources/:id
   */
  deleteResource = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await resourceService.deleteResource(id);

    res.status(200).json({
      success: true,
      data: { message: "Resource deleted successfully" },
    });
  });

  /**
   * Toggle resource active status
   * PATCH /api/resources/:id/toggle-status
   */
  toggleResourceStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const resource = await resourceService.toggleResourceStatus(id);

    res.status(200).json({
      success: true,
      data: resource,
    });
  });

  /**
   * Get resources by vendor
   * GET /api/resources/vendor/:vendorId
   */
  getResourcesByVendor = asyncHandler(async (req: Request, res: Response) => {
    const { vendorId } = req.params;
    const { page = 1, limit = 10, isActive } = req.query;

    const result = await resourceService.getResourcesByVendor(
      vendorId,
      Number(page),
      Number(limit),
      isActive === "true" ? true : isActive === "false" ? false : undefined
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get resources by type
   * GET /api/resources/type/:type
   */
  getResourcesByType = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;
    const { page = 1, limit = 10, isActive } = req.query;

    const result = await resourceService.getResourcesByType(
      type as ResourceType,
      Number(page),
      Number(limit),
      isActive === "true" ? true : isActive === "false" ? false : undefined
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get active resources
   * GET /api/resources/active
   */
  getActiveResources = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;

    const result = await resourceService.getActiveResources(
      Number(page),
      Number(limit)
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Bulk create resources
   * POST /api/resources/bulk
   */
  bulkCreateResources = asyncHandler(async (req: Request, res: Response) => {
    const { resources }: BulkCreateResourcesInput = req.body;
    const result = await resourceService.bulkCreateResources(resources);

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get vendor resource statistics
   * GET /api/resources/vendor/:vendorId/stats
   */
  getVendorResourceStats = asyncHandler(async (req: Request, res: Response) => {
    const { vendorId } = req.params;
    const stats = await resourceService.getVendorResourceStats(vendorId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  });
}

export default new ResourceController();
