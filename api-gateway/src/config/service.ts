export const SERVICES = {
  AUTH: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  BOOKING: process.env.BOOKING_SERVICE_URL || "http://localhost:5002",
  RESOURCE: process.env.RESOURCE_SERVICE_URL || "http://localhost:5003",
  PAYMENT: process.env.PAYMENT_SERVICE_URL || "http://localhost:5004",
};
