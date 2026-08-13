import axios, { AxiosInstance } from "axios";
import { InternalServerError } from "../utils/errors";

interface ActiveResourceCategoryInfo {
  id: string;
  name: string;
  type: string;
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
}

export default new ResourceClient();
