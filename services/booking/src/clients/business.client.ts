import axios, { AxiosInstance } from "axios";
import { InternalServerError } from "../utils/errors";

interface BusinessInfo {
  businessId: string;
  vendorId: string;
  businessName: string;
  status: string;
}

class BusinessClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${process.env.BUSINESS_SERVICE_URL}/api/internal/businesses`, // Internal route for business service
      timeout: 3000, // 3 seconds
      headers: { "x-internal-key": process.env.INTERNAL_SERVICE_SECRET }, // Secret header for service-to-service auth
    });
  }

  async validateBusiness(businessId: string): Promise<BusinessInfo> {
    try {
      console.log("Validating business ID:", businessId);
      console.log(
        "Using BUSINESS_SERVICE_URL:",
        process.env.BUSINESS_SERVICE_URL,
      );
      const response = await this.client.get(`/${businessId}/validate`);
      return response.data.businessInfo;
    } catch (error: any) {
      //  logging can be added here
      console.log("Booking Service Rejected with:", error.response?.data);
      // If it's a timeout or 500, log it and throw an error so the user knows it's a system issue
      console.error(`[BookingClient Error]: ${error.message}`);
      throw new InternalServerError(
        "Unable to verify business identity at this time.",
      );
    }
  }
}

export default new BusinessClient();
