import { BusinessType } from "@prisma/client";
import businessRepository from "../repositories/business.repository";
import bookingClient, {
  DashboardBookingRecord,
} from "../clients/bookling.client";
import resourceClient, { Category, Resource } from "../clients/resource.client";
import { AuthorizationError, NotFoundError } from "../utils/errors";
import {
  BusinessDashboard,
  DashboardBooking,
  DashboardRoomStatus,
  DashboardTopItem,
} from "../types/dashboard.types";

type SupportedType = Extract<BusinessType, "HOTEL" | "SALON" | "CLINIC">;

const round = (value: number) => Math.round(value * 100) / 100;
const amount = (value: string | number) => Number(value) || 0;
const sum = (bookings: DashboardBookingRecord[]) =>
  round(
    bookings.reduce(
      (total, booking) => total + amount(booking.priceAtBooking),
      0,
    ),
  );
const price = (value: string | number, currency: string) =>
  `${currency === "USD" ? "$" : `${currency} `}${amount(value).toFixed(2)}`;

function startOfUtcWeek(date: Date): Date {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  result.setUTCDate(result.getUTCDate() - result.getUTCDay());
  return result;
}

function startOfLocalDay(date: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});
  const localMidnight = `${parts.year}-${parts.month}-${parts.day}T00:00:00`;
  const firstGuess = new Date(`${localMidnight}Z`);
  const rendered = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).format(firstGuess);
  const offset = rendered.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
  const offsetMinutes = offset
    ? Number(offset[1]) * 60 +
      Number(offset[2] ?? 0) * Math.sign(Number(offset[1]))
    : 0;
  return new Date(firstGuess.getTime() - offsetMinutes * 60_000);
}

function timeZoneOf(address: unknown): string {
  if (
    address &&
    typeof address === "object" &&
    "timezone" in address &&
    typeof address.timezone === "string"
  ) {
    return address.timezone;
  }
  return "UTC";
}

function topItems(
  bookings: DashboardBookingRecord[],
  categories: Map<string, string>,
): DashboardTopItem[] {
  const grouped = new Map<
    string,
    { count: number; total: number; currency: string }
  >();
  for (const booking of bookings) {
    const name = categories.get(booking.resourceId) ?? booking.resourceName;
    const current = grouped.get(name) ?? {
      count: 0,
      total: 0,
      currency: booking.currency,
    };
    current.count += 1;
    current.total += amount(booking.priceAtBooking);
    grouped.set(name, current);
  }
  return [...grouped.entries()]
    .sort((left, right) => right[1].count - left[1].count)
    .slice(0, 5)
    .map(([name, item]) => ({
      name,
      bookingCount: item.count,
      price: price(item.total / item.count, item.currency),
    }));
}

function roomStatus(
  resource: Resource,
  bookings: DashboardBookingRecord[],
  categoryName: string,
  now: Date,
): DashboardRoomStatus {
  const activeBooking = bookings.find(
    (booking) =>
      booking.resourceId === resource.id &&
      new Date(booking.startTime) <= now &&
      new Date(booking.endTime) > now,
  );
  const checkout = bookings.some(
    (booking) =>
      booking.resourceId === resource.id &&
      new Date(booking.endTime).toDateString() === now.toDateString(),
  );
  const status =
    resource.status === "MAINTENANCE"
      ? "MAINTENANCE"
      : activeBooking
        ? checkout
          ? "CHECKOUT"
          : "OCCUPIED"
        : "AVAILABLE";
  return {
    id: resource.id,
    name: resource.name,
    type: resource.type,
    status,
    categoryName,
  };
}

class DashboardService {
  async getDashboard(
    ownerId: string,
    businessId?: string,
  ): Promise<BusinessDashboard> {
    if (!businessId)
      throw new AuthorizationError(
        "Authenticated user is not linked to a business",
      );
    const business = await businessRepository.findById(businessId);
    if (!business) throw new NotFoundError("Business not found");
    if (business.ownerId !== ownerId)
      throw new AuthorizationError("You do not have access to this business");
    if (!["HOTEL", "SALON", "CLINIC"].includes(business.type))
      throw new NotFoundError(
        "Dashboard is not supported for this business type",
      );

    const now = new Date();
    const todayStart = startOfLocalDay(now, timeZoneOf(business.address));
    const tomorrow = new Date(todayStart);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const currentMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const rangeStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );
    const bookings = await bookingClient.getDashboardBookings(
      businessId,
      rangeStart.toISOString(),
      tomorrow.toISOString(),
    );
    const categories: Category[] =
      business.type === "HOTEL"
        ? await resourceClient.getDashboardResources(businessId)
        : [];
    const categoryByResource = new Map(
      categories.flatMap((category) =>
        category.resources.map(
          (resource) => [resource.id, category.name] as const,
        ),
      ),
    );
    const todayBookings = bookings.filter(
      (booking) =>
        new Date(booking.startTime) < tomorrow &&
        new Date(booking.endTime) > todayStart,
    );
    const monthly = bookings.filter(
      (booking) => new Date(booking.startTime) >= currentMonthStart,
    );
    const previousMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );
    const previousMonth = bookings.filter(
      (booking) =>
        new Date(booking.startTime) >= previousMonthStart &&
        new Date(booking.startTime) < currentMonthStart,
    );
    const thisWeekStart = startOfUtcWeek(now);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);
    const thisWeek = bookings.filter(
      (booking) => new Date(booking.startTime) >= thisWeekStart,
    );
    const lastWeek = bookings.filter(
      (booking) =>
        new Date(booking.startTime) >= lastWeekStart &&
        new Date(booking.startTime) < thisWeekStart,
    );
    const type = business.type as SupportedType;
    const hotel = type === "HOTEL";
    const resources = categories
      .flatMap((category) => category.resources)
      .filter((resource) => resource.status !== "DELETED");
    const occupied = resources.filter((resource) =>
      bookings.some(
        (booking) =>
          booking.resourceId === resource.id &&
          new Date(booking.startTime) <= now &&
          new Date(booking.endTime) > now,
      ),
    ).length;
    const monthTotal = sum(monthly);
    const previousTotal = sum(previousMonth);

    return {
      type,
      stats: {
        occupancyRate:
          hotel && resources.length
            ? round((occupied / resources.length) * 100)
            : 0,
        checkInsToday: hotel
          ? bookings.filter(
              (booking) =>
                new Date(booking.startTime) >= todayStart &&
                new Date(booking.startTime) < tomorrow,
            ).length
          : 0,
        checkOutsToday: hotel
          ? bookings.filter(
              (booking) =>
                new Date(booking.endTime) >= todayStart &&
                new Date(booking.endTime) < tomorrow,
            ).length
          : 0,
        bookingsToday: hotel ? 0 : todayBookings.length,
        completedToday: hotel
          ? 0
          : todayBookings.filter((booking) => booking.status === "COMPLETED")
              .length,
        upcomingToday: hotel
          ? 0
          : todayBookings.filter(
              (booking) =>
                new Date(booking.startTime) > now &&
                booking.status !== "CANCELLED",
            ).length,
        revenueToday: sum(todayBookings),
      },
      todayBookings: todayBookings.map(
        (booking): DashboardBooking => ({
          id: booking.id,
          guestName: booking.userId,
          resourceName: booking.resourceName,
          categoryName:
            categoryByResource.get(booking.resourceId) ?? "Uncategorized",
          startTime: new Date(booking.startTime).toISOString(),
          endTime: new Date(booking.endTime).toISOString(),
          price: price(booking.priceAtBooking, booking.currency),
          status: booking.status,
        }),
      ),
      roomStatus: hotel
        ? categories
            .flatMap((category) => category.resources)
            .map((resource) =>
              roomStatus(
                resource,
                bookings,
                categoryByResource.get(resource.id) ?? "Uncategorized",
                now,
              ),
            )
        : [],
      topItems: topItems(bookings, categoryByResource),
      revenue: {
        monthly: monthTotal,
        thisWeek: sum(thisWeek),
        lastWeek: sum(lastWeek),
        avgPerUnit: monthly.length ? round(monthTotal / monthly.length) : 0,
        unitLabel: hotel ? "night" : type === "SALON" ? "session" : "visit",
        monthChange: previousTotal
          ? round(((monthTotal - previousTotal) / previousTotal) * 100)
          : monthTotal
            ? 100
            : 0,
      },
    };
  }
}

export default new DashboardService();
