import { Request, Response } from "express";
import { BookingStatus } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler";
import {
  CreateBookingInput,
  UpdateBookingInput,
  CancelBookingInput,
} from "../utils/validators";
import bookingService from "../services/booking.service";

class BookingController {
  /**
   * Create a new booking
   * POST /api/bookings
   */
  createBooking = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    const input: CreateBookingInput = req.body;
    const booking = await bookingService.createBooking(userId, input);

    res.status(201).json({
      success: true,
      data: booking,
    });
  });

  /**
   * Get all bookings with filters
   * GET /api/bookings
   */
  getBookings = asyncHandler(async (req: Request, res: Response) => {
    const result = await bookingService.getBookings(req.query as any);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get booking by ID
   * GET /api/bookings/:id
   */
  getBookingById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const booking = await bookingService.getBookingById(id);

    res.status(200).json({
      success: true,
      data: booking,
    });
  });

  /**
   * Update booking
   * PATCH /api/bookings/:id
   */
  updateBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const input: UpdateBookingInput = req.body;
    const booking = await bookingService.updateBooking(id, input);

    res.status(200).json({
      success: true,
      data: booking,
    });
  });

  /**
   * Cancel booking
   * POST /api/bookings/:id/cancel
   */
  cancelBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { cancelReason }: CancelBookingInput = req.body;
    const booking = await bookingService.cancelBooking(id, cancelReason);

    res.status(200).json({
      success: true,
      data: booking,
    });
  });

  /**
   * Update booking status
   * PATCH /api/bookings/:id/status
   */
  updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const booking = await bookingService.updateBookingStatus(
      id,
      status as BookingStatus,
    );

    res.status(200).json({
      success: true,
      data: booking,
    });
  });

  /**
   * Get user bookings
   * GET /api/bookings/user/:userId
   */
  getUserBookings = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await bookingService.getUserBookings(
      userId,
      Number(page),
      Number(limit),
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Get vendor bookings
   * GET /api/bookings/vendor/:vendorId
   */
  getVendorBookings = asyncHandler(async (req: Request, res: Response) => {
    const { vendorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await bookingService.getVendorBookings(
      vendorId,
      Number(page),
      Number(limit),
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Delete booking
   * DELETE /api/bookings/:id
   */
  deleteBooking = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await bookingService.deleteBooking(id);

    res.status(200).json({
      success: true,
      data: { message: "Booking deleted successfully" },
    });
  });
}

export default new BookingController();
