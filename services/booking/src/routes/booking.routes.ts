import { Router } from "express";
import bookingController from "../controllers/booking.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validator";
import {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
  getBookingByIdSchema,
  getBookingsSchema,
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
  bookingController.createBooking
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
  bookingController.getBookings
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
  bookingController.getBookingById
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
  bookingController.updateBooking
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
  bookingController.cancelBooking
);

/**
 * @route   GET /api/bookings/user/:userId
 * @desc    Get user bookings
 * @access  Private (Authenticated users)
 */
router.get("/user/:userId", authenticate, bookingController.getUserBookings);

/**
 * @route   GET /api/bookings/vendor/:vendorId
 * @desc    Get vendor bookings
 * @access  Private (Vendor, Admin)
 */
router.get(
  "/vendor/:vendorId",
  authenticate,
  authorize("ADMIN", "VENDOR"),
  bookingController.getVendorBookings
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
  bookingController.deleteBooking
);

export default router;
