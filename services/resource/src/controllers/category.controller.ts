import { Request, Response } from "express";
import resourceService from "../services/resource.service";
import { asyncHandler } from "../utils/asyncHandler";

class CategoryController {
  // Create category
  createResourceCategory = asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;
    const businessId = req.user?.businessId as string;

    const category = await resourceService.createCategory(name, businessId);

    res.status(201).json({
      success: true,
      data: category,
    });
  });

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

  //   // Get all resources
  //   getAllResources = asyncHandler(async (req: Request, res: Response) => {
  //     const query = req.query as any;
  //     const page = parseInt(query.page) || 1;
  //     const limit = parseInt(query.limit) || 10;
  //     const businessId = query.businessId;
  //     const type = query.type as ResourceType | undefined;
  //     const status = query.status as string | undefined;
  //     const search = query.search;
  //     const minPrice = query.minPrice ? parseFloat(query.minPrice) : undefined;
  //     const maxPrice = query.maxPrice ? parseFloat(query.maxPrice) : undefined;

  //     const result = await resourceService.getAllResources({
  //       page,
  //       limit,
  //       businessId,
  //       type,
  //       status,
  //       search,
  //       minPrice,
  //       maxPrice,
  //     });

  //     res.status(200).json({
  //       success: true,
  //       data: result,
  //     });
  //   });

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
