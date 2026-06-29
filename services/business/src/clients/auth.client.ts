import axios, { AxiosError, AxiosInstance } from "axios";
import { handleServiceError } from "../utils/handleServiceError";

class AuthClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${process.env.AUTH_SERVICE_URL}/api/internal`, // Internal route for business service
      timeout: 60000, // 60 seconds
      headers: { "x-internal-key": process.env.INTERNAL_SERVICE_SECRET }, // Secret header for service-to-service auth
    });
  }

  async validateUser(userId: string): Promise<void> {
    try {
      const response = await this.client.get(`/${userId}/validate`);
      return response.data;
    } catch (error: any) {
      handleServiceError(error as AxiosError);
    }
  }

  async updateUserStatus(userId: string, status: string): Promise<void> {
    try {
      console.log("here it is callled with status:", status);
      await this.client.patch(`/${userId}/status`, { status });
    } catch (error: any) {
      handleServiceError(error as AxiosError);
    }
  }
}

export default new AuthClient();
