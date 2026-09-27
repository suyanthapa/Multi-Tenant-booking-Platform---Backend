import { ResourceType } from "@prisma/client";

export interface CreateResourceDTO {
  name: string;
  type: ResourceType; // Enum
  floor?: string;
  businessId: string;
  categoryId?: string;
}

export interface activeResourcesInCategoryResponse {
  status: boolean;
  availableResourcesInfo: ActiveResourceInfo[];
}

export interface ActiveResourceInfo {
  id: string;
  name: string;
  type: ResourceType;
}
