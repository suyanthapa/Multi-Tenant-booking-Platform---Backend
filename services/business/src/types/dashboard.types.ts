import { BusinessType } from "@prisma/client";

export type DashboardUnitLabel = "night" | "session" | "visit";
export type RoomStatus = "OCCUPIED" | "AVAILABLE" | "CHECKOUT" | "MAINTENANCE";

export interface DashboardStats {
  occupancyRate: number;
  checkInsToday: number;
  checkOutsToday: number;
  bookingsToday: number;
  completedToday: number;
  upcomingToday: number;
  revenueToday: number;
}

export interface DashboardBooking {
  id: string;
  guestName: string;
  resourceName: string;
  categoryName: string;
  startTime: string;
  endTime: string;
  price: string;
  status: string;
}

export interface DashboardRoomStatus {
  id: string;
  name: string;
  type: string;
  status: RoomStatus;
  categoryName: string;
}

export interface DashboardTopItem {
  name: string;
  bookingCount: number;
  price: string;
}

export interface DashboardRevenue {
  monthly: number;
  thisWeek: number;
  lastWeek: number;
  avgPerUnit: number;
  unitLabel: DashboardUnitLabel;
  monthChange: number;
}

export interface BusinessDashboard {
  type: Extract<BusinessType, "HOTEL" | "SALON" | "CLINIC">;
  stats: DashboardStats;
  todayBookings: DashboardBooking[];
  roomStatus: DashboardRoomStatus[];
  topItems: DashboardTopItem[];
  revenue: DashboardRevenue;
}
