import { ResourceType } from "@prisma/client";

export interface CreateResourceDTO {
  name: string;
  type: ResourceType; // Enum
  price: number;
  businessId: string;
  categoryId: string;
  metadata?: Record<string, any>;
}
