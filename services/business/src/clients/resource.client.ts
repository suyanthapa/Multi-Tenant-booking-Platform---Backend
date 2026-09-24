import axios, { AxiosInstance } from "axios";
import { InternalServerError } from "../utils/errors";

interface ActiveResourceCategoryInfo {
  id: string;
  name: string;
  type: string;
}

export interface CategoryImage {
  id: string;
  url: string;
  isCover: boolean;
  order: number;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  description: string | null;
  price: string;
  currency: string;
  status: string;
  metadata: Record<string, unknown> | null;
}

export interface Category {
  id: string;
  name: string;
  images: CategoryImage[];
  resources: Resource[];
}

class ResourceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${process.env.RESOURCE_SERVICE_URL}/api/internal/resources`, // Internal route for business service
      timeout: 60000, // 60 seconds
      headers: { "x-internal-key": process.env.INTERNAL_SERVICE_SECRET }, // Secret header for service-to-service auth
    });
  }

  async getBatchBusinessCategories(
    businessIds: string[],
  ): Promise<Record<string, ActiveResourceCategoryInfo[]>> {
    try {
      console.log(
        "Requesting active categories for business IDs:",
        businessIds,
      );
      const response = await this.client.post(`/batch-active-categories`, {
        businessIds, // Send the whole array
      });
      console.log("Active Categories fetched:", response.data);
      return response.data.availableCategoriesInfo; // Expected: { "id1": [...], "id2": [...] }
    } catch (error: any) {
      //  logging can be added here
      console.log("Resource Service Rejected with:", error.response?.data);
      // If it's a timeout or 500, log it and throw an error so the user knows it's a system issue
      console.error(`[ResourceClient   Error]: ${error.message}`);
      throw new InternalServerError(
        "Unable to verify business identity at this time.",
      );
    }
  }

  async getBatchBusinessLowestPrices(
    businessIds: string[],
  ): Promise<Record<string, number | null>> {
    try {
      console.log(
        "Requesting lowest resource prices for business IDs:",
        businessIds,
      );
      const response = await this.client.post(`/batch-business-lowest-prices`, {
        businessIds,
      });
      console.log("Lowest prices fetched:", response.data);
      return response.data.availableBusinessPricesInfo;
    } catch (error: any) {
      console.log("Resource Service Rejected with:", error.response?.data);
      console.error(`[ResourceClient Error]: ${error.message}`);
      throw new InternalServerError(
        "Unable to verify business pricing at this time.",
      );
    }
  }

  async getCategoriesForBusiness(businessId: string): Promise<Category[]> {
    try {
      const response = await this.client.get(
        `/businesses/${businessId}/categories`,
      );
      return response.data.data ?? [];
    } catch (error: any) {
      console.error("[ResourceClient Error]:", error.message);

      // if resource service is down — return empty, don't fail the whole request
      if (error.code === "ECONNREFUSED" || error.response?.status >= 500) {
        console.error(
          "[ResourceClient] Resource service unavailable — returning empty categories",
        );
        return [];
      }

      throw new InternalServerError("Unable to fetch categories at this time.");
    }
  }
}

export default new ResourceClient();
