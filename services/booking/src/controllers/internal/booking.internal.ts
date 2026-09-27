import { Request, Response } from "express";
import { successResponse } from "../../utils/response";
import { asyncHandler } from "../../utils/asyncHandler";
import bookingService from "../../services/booking.service";

class InternalBookingController {
  getUnavailableResources = asyncHandler(
    async (req: Request, res: Response) => {
      const { resourceIds, startDate, endDate } = req.body;

      const unavailable = await bookingService.getUnavailableResources(
        resourceIds,
        startDate,
        endDate,
      );

      successResponse(res, unavailable, "Unavailable resources fetched");
    },
  );

  getDashboardBookings = asyncHandler(async (req: Request, res: Response) => {
    const { businessId, startDate, endDate } = req.body;
    const bookings = await bookingService.getDashboardBookings(
      businessId,
      startDate,
      endDate,
    );
    successResponse(res, bookings, "Dashboard bookings fetched");
  });
}

export default new InternalBookingController();
