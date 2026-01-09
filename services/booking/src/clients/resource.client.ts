import axios, { AxiosInstance } from "axios";
import { InternalServerError } from "../utils/errors";

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

class ResourceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${process.env.RESOURCE_SERVICE_URL}/api/internal/resources`, // Internal route for business service
      timeout: 3000, // 3 seconds - Professional services don't wait forever
      headers: { "x-internal-key": process.env.INTERNAL_SERVICE_SECRET }, // Secret header for service-to-service auth
    });
  }

  async validateResource(
    resourceId: string,
    ResourceName: string
  ): Promise<ResourceInfo> {
    try {
      console.log("Validating resource ID:", resourceId);
      console.log(
        "Using RESOURCE_SERVICE_URL:",
        process.env.RESOURCE_SERVICE_URL
      );
      const response = await this.client.post(`/${resourceId}/exists`, {
        name: ResourceName,
      });
      return response.data.resourceInfo;
    } catch (error: any) {
      //  logging can be added here
      console.log("Booking Service Rejected with:", error.response?.data);
      // If it's a timeout or 500, log it and throw an error so the user knows it's a system issue
      console.error(`[BookingClient Error]: ${error.message}`);
      throw new InternalServerError(
        "Unable to verify business identity at this time."
      );
    }
  }
}

export default new ResourceClient();
