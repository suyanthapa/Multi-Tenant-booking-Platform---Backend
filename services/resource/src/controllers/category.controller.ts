import { Request, Response } from "express";
import resourceService from "../services/resource.service";
import { asyncHandler } from "../utils/asyncHandler";

class CategoryController {
  // Create category
  createCategory = asyncHandler(async (req: Request, res: Response) => {
    const { name, businessId } = req.body;

    const category = await resourceService.createCategory(name, businessId);

    res.status(201).json({
      success: true,
      data: category,
      message: "Category created successfully",
    });
  });

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

  // Get category by ID
  getCategoryById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await resourceService.getCategoryById(id);

    res.status(200).json({
      success: true,
      data: category,
    });
  });

  // Update category
  updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    const category = await resourceService.updateCategory(id, { name });

    res.status(200).json({
      success: true,
      data: category,
      message: "Category updated successfully",
    });
  });

  // Delete category
  deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await resourceService.deleteCategory(id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  });
}

export default new CategoryController();
