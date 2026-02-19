import axios, { AxiosInstance } from "axios";
import { InternalServerError } from "../utils/errors";
import { BusinessType } from "../utils/validators";

interface BusinessInfo {
  businessId: string;
  vendorId: string;
  businessName: string;
  status: string;
}
interface BusinessAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
interface createBusinessData {
  ownerId: string;
  name: string;
  description: string;
  type: BusinessType;
  address: BusinessAddress;
  phone?: string;
  email: string;
}

export interface BusinessResponse {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  type: "HOTEL" | "CLINIC" | "SALON" | "CO_WORKING" | "OTHER";
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phone: string | null;
  email: string;
  status: "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
  isVerified: boolean;
  createdAt: string; // Transmitted as ISO String over API
  updatedAt: string; // Transmitted as ISO String over API
}

class BusinessClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${process.env.BUSINESS_SERVICE_URL}/api/internal/businesses`, // Internal route for business service,
      timeout: 6000, // 6 seconds
      headers: { "x-internal-key": process.env.INTERNAL_SERVICE_SECRET }, // Secret header for service-to-service auth
    });
  }

  async validateBusinessByOwner(userId: string): Promise<any> {
    try {
      const response = await this.client.get(`/user/${userId}/business`);
      return response.data.businessInfo;
    } catch (error: any) {
      //  logging can be added here
      console.log("Booking Service Rejected with:", error.response?.data);

      if (error.response && error.response.status === 404) {
        return null; // Return null so the AuthService knows there's no business
      }
      // If it's a timeout or 500, log it and throw an error so the user knows it's a system issue

      console.error(`[BookingClient Error]: ${error.message}`);
      throw new InternalServerError(
        "Unable to verify business identity at this time.",
      );
    }
  }

  async createBusiness(data: createBusinessData): Promise<BusinessResponse> {
    try {
      console.log("Creating business with data:", data);
      const response = await this.client.post(`/create`, data);
      console.log("Business created successfully:", response.data);
      return response.data;
    } catch (error: any) {
      console.log("Business Service Rejected with:", error.response?.data);
      console.error(`[Business  Client Error]: ${error.message}`);
      throw new InternalServerError("Unable to create business at this time.");
    }
  }
}
export default new BusinessClient();
