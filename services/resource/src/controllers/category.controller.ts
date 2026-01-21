import { Request, Response } from "express";
import resourceService from "../services/resource.service";
import { asyncHandler } from "../utils/asyncHandler";

class CategoryController {
  // Create category

  //   // Bulk create resources
  //   bulkCreateResources = asyncHandler(async (req: Request, res: Response) => {
  //     const data: BulkCreateResourceInput = req.body;

  //     const result = await resourceService.bulkCreateResources(data);

  //     res.status(201).json({
  //       success: true,
  //       data: result,
  //       message: `${result.count} resources created successfully`,
  //     });
  //   });

  // Get all categories
  getAllCategories = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as any;
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const businessId = query.businessId;
    const search = query.search;

    const result = await resourceService.getAllResourceCategories({
      page,
      limit,
      businessId,
      search,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  //   // Get resource by ID
  //   getResourceById = asyncHandler(async (req: Request, res: Response) => {
  //     const { id } = req.params;

  //     const resource = await resourceService.getResourceById(id);

  //     res.status(200).json({
  //       success: true,
  //       data: resource,
  //     });
  //   });

  //   // Update resource
  //   updateResource = asyncHandler(async (req: Request, res: Response) => {
  //     const { id } = req.params;
  //     const data: UpdateResourceInput = req.body;

  //     const resource = await resourceService.updateResource(id, data);

  //     res.status(200).json({
  //       success: true,
  //       data: resource,
  //     });
  //   });

  //   // Delete resource
  //   deleteResource = asyncHandler(async (req: Request, res: Response) => {
  //     const { id } = req.params;

  //     await resourceService.deleteResource(id);

  //     res.status(200).json({
  //       success: true,
  //       message: "Resource deleted successfully",
  //     });
  //   });
}

export default new CategoryController();
