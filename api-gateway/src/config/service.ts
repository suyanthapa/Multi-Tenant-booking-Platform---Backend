export const SERVICES = {
  AUTH: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  BOOKING: process.env.BOOKING_SERVICE_URL || "http://localhost:3002",
  BUSINESS: process.env.BUSINESS_SERVICE_URL || "http://localhost:3003",
  RESOURCE: process.env.RESOURCE_SERVICE_URL || "http://localhost:3004",
};
