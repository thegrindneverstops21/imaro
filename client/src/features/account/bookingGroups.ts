import type { Booking } from "../../types/api";

const INACTIVE_STATUSES = new Set(["cancelled", "expired", "completed"]);

export type BookingGroups = { upcoming: Booking[]; past: Booking[] };

export const todayInJohannesburg = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg" }).format(
    new Date(),
  );

export function groupBookings(
  bookings: Booking[],
  today: string,
): BookingGroups {
  const isUpcoming = (booking: Booking) =>
    booking.checkOut >= today && !INACTIVE_STATUSES.has(booking.status);
  const upcoming = bookings
    .filter(isUpcoming)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const past = bookings
    .filter((booking) => !isUpcoming(booking))
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  return { upcoming, past };
}
