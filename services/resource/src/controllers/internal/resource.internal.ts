import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import resourceRepository from "../../repositories/resource.repository";
import { ActiveResourceInfo } from "../../types/interfaces";

class ResourceInternalController {
  checkExists = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    console.log("Checking existence for Resource ID:", id, "with name:", name);
    const resource = await resourceRepository.checkExists(id, name);

    const resourceInfo = {
      exists: !!resource && resource.name === name,

      name: resource?.name,

      businessId: resource?.businessId,
    };

    console.log("Resource existence check:", resourceInfo);
    // We return a simple flat object
    res.status(200).json({
      success: true,
      resourceInfo: resourceInfo,
    });
  });

  activeResourcesInCategory = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { categoryId } = req.params;

      const availableResources: ActiveResourceInfo[] =
        await resourceRepository.activeResourcesInCategory(categoryId);

      res.status(200).json({
        success: true,
        availableResourcesInfo: availableResources,
      });
    },
  );

  getBatchBusinessCategories = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { businessIds } = req.body;
      console.log(
        "Received batch category request for business IDs:",
        businessIds,
      );
      const categoriesMap =
        await resourceRepository.getBatchBusinessCategories(businessIds);

      res.status(200).json({
        success: true,
        availableCategoriesInfo: categoriesMap,
      });
    },
  );

  getBatchBusinessLowestPrices = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { businessIds } = req.body;
      console.log(
        "Received batch lowest price request for business IDs:",
        businessIds,
      );

      const lowestPricesMap =
        await resourceRepository.getBatchBusinessLowestPrices(businessIds);

      res.status(200).json({
        success: true,
        availableBusinessPricesInfo: lowestPricesMap,
      });
    },
  );
}

export default new ResourceInternalController();
