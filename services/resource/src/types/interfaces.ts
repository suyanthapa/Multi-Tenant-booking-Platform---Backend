import { ResourceType } from "@prisma/client";

export interface CreateResourceDTO {
  name: string;
  type: ResourceType; // Enum
  price: number;
  businessId: string;
  categoryId: string;
  metadata?: Record<string, any>;
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
