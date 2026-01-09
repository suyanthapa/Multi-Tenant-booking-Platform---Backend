import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import resourceRepository from "../../repositories/resource.repository";

interface ResourceInfo {
  exists: boolean;
  status?: string;
  name?: string;
  type?: string;
  price?: number;
  currency?: string;
  businessId?: string;
  businessName?: string;
}

class ResourceInternalController {
  checkExists = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    const resource = await resourceRepository.checkExists(id, name);

    const resourceInfo: ResourceInfo = {
      exists: !!resource && resource.name === name,
      status: resource?.status,
      name: resource?.name,
      type: resource?.type,
      price: resource ? Number(resource.price) : undefined,
      currency: resource?.currency,
      businessId: resource?.businessId,
      businessName: "demo name",
    };
    // We return a simple flat object
    res.status(200).json({
      success: true,
      resourceInfo: resourceInfo,
    });
  });
}

export default new ResourceInternalController();
