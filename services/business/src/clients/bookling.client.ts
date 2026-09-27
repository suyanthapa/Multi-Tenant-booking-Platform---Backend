// services/business/src/clients/booking.client.ts

import axios, { AxiosInstance } from "axios";
import { InternalServerError } from "../utils/errors";

export interface DashboardBookingRecord {
  id: string;
  userId: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  priceAtBooking: string | number;
  currency: string;
  startTime: string;
  endTime: string;
  status: string;
}

class BookingClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${process.env.BOOKING_SERVICE_URL}/api/internal`,
      timeout: 10000,
      headers: { "x-internal-key": process.env.INTERNAL_SERVICE_SECRET },
    });
  }

  async getUnavailableResources(
    resourceIds: string[],
    startDate: string,
    endDate: string,
  ): Promise<string[]> {
    try {
      if (!resourceIds.length) return [];

      const response = await this.client.post(
        "/bookings/unavailable-resources",
        { resourceIds, startDate, endDate },
      );
      return response.data.data ?? [];
    } catch (error: any) {
      console.error("[BookingClient Error]:", error.message);

      // if booking service is down — assume all available
      // don't fail the whole business detail request
      if (error.code === "ECONNREFUSED" || error.response?.status >= 500) {
        console.error(
          "[BookingClient] Booking service unavailable — assuming all available",
        );
        return [];
      }

      throw new InternalServerError(
        "Unable to check availability at this time.",
      );
    }
  }

  async getDashboardBookings(
    businessId: string,
    startDate: string,
    endDate: string,
  ): Promise<DashboardBookingRecord[]> {
    try {
      const response = await this.client.post("/bookings/dashboard-bookings", {
        businessId,
        startDate,
        endDate,
      });
      return response.data.data ?? [];
    } catch (error: any) {
      console.error("[BookingClient Error]:", error.message);
      throw new InternalServerError("Unable to fetch dashboard bookings.");
    }
  }
}

export default new BookingClient();
