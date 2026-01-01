import { Request, Response } from "express";
import { bookingService } from "../services";
import { BookingStatus, PaymentStatus } from "@prisma/client";

class BookingController {
  /**
   * Create a new booking
   * POST /api/bookings
   */
  async createBooking(req: Request, res: Response): Promise<void> {
    const booking = await bookingService.createBooking(req.body);

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  }

  /**
   * Get all bookings with filters
   * GET /api/bookings
   */
  async getBookings(req: Request, res: Response): Promise<void> {
    const result = await bookingService.getBookings(req.query);

    res.status(200).json({
      success: true,
      message: "Bookings retrieved successfully",
      data: result,
    });
  }

  /**
   * Get booking by ID
   * GET /api/bookings/:id
   */
  async getBookingById(req: Request, res: Response): Promise<void> {
    const booking = await bookingService.getBookingById(req.params.id);

    res.status(200).json({
      success: true,
      message: "Booking retrieved successfully",
      data: booking,
    });
  }

  /**
   * Update booking
   * PATCH /api/bookings/:id
   */
  async updateBooking(req: Request, res: Response): Promise<void> {
    const booking = await bookingService.updateBooking(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: booking,
    });
  }

  /**
   * Cancel booking
   * POST /api/bookings/:id/cancel
   */
  async cancelBooking(req: Request, res: Response): Promise<void> {
    const { cancelReason } = req.body;
    const booking = await bookingService.cancelBooking(
      req.params.id,
      cancelReason
    );

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
    });
  }

  /**
   * Update booking status
   * PATCH /api/bookings/:id/status
   */
  async updateBookingStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.body;
    const booking = await bookingService.updateBookingStatus(
      req.params.id,
      status as BookingStatus
    );

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: booking,
    });
  }

  /**
   * Update payment status
   * PATCH /api/bookings/:id/payment-status
   */
  async updatePaymentStatus(req: Request, res: Response): Promise<void> {
    const { paymentStatus } = req.body;
    const booking = await bookingService.updatePaymentStatus(
      req.params.id,
      paymentStatus as PaymentStatus
    );

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: booking,
    });
  }

  /**
   * Get user bookings
   * GET /api/bookings/user/:userId
   */
  async getUserBookings(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { page, limit } = req.query;

    const result = await bookingService.getUserBookings(
      userId,
      Number(page) || 1,
      Number(limit) || 10
    );

    res.status(200).json({
      success: true,
      message: "User bookings retrieved successfully",
      data: result,
    });
  }

  /**
   * Get vendor bookings
   * GET /api/bookings/vendor/:vendorId
   */
  async getVendorBookings(req: Request, res: Response): Promise<void> {
    const { vendorId } = req.params;
    const { page, limit } = req.query;

    const result = await bookingService.getVendorBookings(
      vendorId,
      Number(page) || 1,
      Number(limit) || 10
    );

    res.status(200).json({
      success: true,
      message: "Vendor bookings retrieved successfully",
      data: result,
    });
  }

  /**
   * Delete booking
   * DELETE /api/bookings/:id
   */
  async deleteBooking(req: Request, res: Response): Promise<void> {
    const booking = await bookingService.deleteBooking(req.params.id);

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
      data: booking,
    });
  }
}

export default new BookingController();
