import { Router } from "express";
import bookingController from "../controllers/booking.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validator";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
  getBookingByIdSchema,
  getBookingsSchema,
  updatePaymentStatusSchema,
} from "../utils/validators";

const router = Router();

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Private (Authenticated users)
 */
router.post(
  "/",
  authenticate,
  validate(createBookingSchema),
  asyncHandler(bookingController.createBooking)
);

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings with filters
 * @access  Private (Authenticated users)
 */
router.get(
  "/",
  authenticate,
  validate(getBookingsSchema),
  asyncHandler(bookingController.getBookings)
);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private (Authenticated users)
 */
router.get(
  "/:id",
  authenticate,
  validate(getBookingByIdSchema),
  asyncHandler(bookingController.getBookingById)
);

/**
 * @route   PATCH /api/bookings/:id
 * @desc    Update booking
 * @access  Private (Authenticated users)
 */
router.patch(
  "/:id",
  authenticate,
  validate(updateBookingSchema),
  asyncHandler(bookingController.updateBooking)
);

/**
 * @route   POST /api/bookings/:id/cancel
 * @desc    Cancel booking
 * @access  Private (Authenticated users)
 */
router.post(
  "/:id/cancel",
  authenticate,
  validate(cancelBookingSchema),
  asyncHandler(bookingController.cancelBooking)
);

/**
 * @route   PATCH /api/bookings/:id/payment-status
 * @desc    Update payment status
 * @access  Private (Admin, Vendor)
 */
router.patch(
  "/:id/payment-status",
  authenticate,
  authorize("ADMIN", "VENDOR"),
  validate(updatePaymentStatusSchema),
  asyncHandler(bookingController.updatePaymentStatus)
);

/**
 * @route   GET /api/bookings/user/:userId
 * @desc    Get user bookings
 * @access  Private (Authenticated users)
 */
router.get(
  "/user/:userId",
  authenticate,
  asyncHandler(bookingController.getUserBookings)
);

/**
 * @route   GET /api/bookings/vendor/:vendorId
 * @desc    Get vendor bookings
 * @access  Private (Vendor, Admin)
 */
router.get(
  "/vendor/:vendorId",
  authenticate,
  authorize("ADMIN", "VENDOR"),
  asyncHandler(bookingController.getVendorBookings)
);

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Delete booking
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate(getBookingByIdSchema),
  asyncHandler(bookingController.deleteBooking)
);

export default router;
