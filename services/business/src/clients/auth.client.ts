import axios, { AxiosInstance } from "axios";
import { InternalServerError } from "../utils/errors";

class AuthClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${process.env.AUTH_SERVICE_URL}/api/internal`, // Internal route for business service
      timeout: 3000, // 3 seconds - Professional services don't wait forever
      headers: { "x-internal-key": process.env.INTERNAL_SERVICE_SECRET }, // Secret header for service-to-service auth
    });
  }

  async validateUser(userId: string): Promise<void> {
    try {
      const response = await this.client.get(`/${userId}/validate`);
      return response.data;
    } catch (error: any) {
      console.log("Auth Service Rejected with:", error.response?.data);

      console.error(`[AuthClient   Error]: ${error.message}`);
      throw new InternalServerError(
        "Unable to verify Auth identity at this time.",
      );
    }
  }
}

export default new AuthClient();
