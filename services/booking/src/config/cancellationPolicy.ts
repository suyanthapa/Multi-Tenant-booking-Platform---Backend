/**
 * Cancellation Policy Configuration
 *
 * This file defines the cancellation and refund policies for bookings.
 * Modify these values to adjust your platform's cancellation rules.
 */

export interface CancellationPolicyRule {
  minHours: number;
  maxHours?: number;
  refundPercentage: number;
  description: string;
}

/**
 * Default cancellation policy rules
 * Rules are evaluated in order from top to bottom
 */
export const CANCELLATION_POLICY_RULES: CancellationPolicyRule[] = [
  {
    minHours: 48,
    refundPercentage: 100,
    description: "Full refund - Cancelled more than 48 hours in advance",
  },
  {
    minHours: 24,
    maxHours: 48,
    refundPercentage: 50,
    description: "50% refund - Cancelled between 24-48 hours in advance",
  },
  {
    minHours: 12,
    maxHours: 24,
    refundPercentage: 25,
    description: "25% refund - Cancelled between 12-24 hours in advance",
  },
  {
    minHours: 0,
    maxHours: 12,
    refundPercentage: 0,
    description: "No refund - Cancelled less than 12 hours before booking",
  },
];

/**
 * Get refund details based on cancellation policy
 */
export function calculateRefund(
  startTime: Date,
  policy: CancellationPolicyRule[] = CANCELLATION_POLICY_RULES,
): {
  refundPercentage: number;
  message: string;
} {
  const now = new Date();
  const bookingStartTime = new Date(startTime);
  const hoursUntilBooking =
    (bookingStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  // If booking time has passed
  if (hoursUntilBooking < 0) {
    return {
      refundPercentage: 0,
      message: "No refund - Booking time has already passed",
    };
  }

  // Find applicable rule
  for (const rule of policy) {
    if (hoursUntilBooking >= rule.minHours) {
      if (!rule.maxHours || hoursUntilBooking < rule.maxHours) {
        return {
          refundPercentage: rule.refundPercentage,
          message: rule.description,
        };
      }
    }
  }

  // Fallback - no refund
  return {
    refundPercentage: 0,
    message: "No refund applicable",
  };
}
