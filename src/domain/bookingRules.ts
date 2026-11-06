import {
  CANCELLABLE_STATUSES,
  HOLD_MINUTES,
  MS_PER_MINUTE,
  PaymentStatus,
} from "../constants/domain";
import type { BookingAccess, BookingRow, RoomSummary } from "./bookingTypes";
import type { CancellationOutcome } from "./cancellation";

// A new booking holds the room for 15 minutes while the guest pays.
export const holdExpiresAt = (now: Date): Date =>
  new Date(now.getTime() + HOLD_MINUTES * MS_PER_MINUTE);

// Only live bookings can be cancelled, and not once the stay has started.
export function canCancel(
  booking: Pick<BookingRow, "status" | "checkIn">,
  today: string,
): boolean {
  return (
    CANCELLABLE_STATUSES.includes(booking.status) && booking.checkIn > today
  );
}

// The manage token (emailed to the guest) or the signed-in owner may see a booking.
export function canAccessBooking(
  ownerId: number | null,
  access: BookingAccess,
  tokenMatches: boolean,
): boolean {
  if (tokenMatches) return true;
  return access.userId !== null && access.userId === ownerId;
}

// How much money has actually reached us (0 unless the booking is marked paid).
export const amountPaid = (
  booking: Pick<BookingRow, "paymentStatus" | "totalAmount" | "amountPaid">,
): number =>
  booking.paymentStatus === PaymentStatus.Paid
    ? (booking.amountPaid ?? booking.totalAmount)
    : 0;

// Late-cancellation fee: one night in every booked room.
export const firstNightCharge = (rooms: RoomSummary[]): number =>
  rooms.reduce((sum, room) => sum + room.rooms * room.pricePerNight, 0);

// Money only goes back if something was paid and the refund is above zero.
export function paymentStatusAfterCancel(
  booking: Pick<BookingRow, "paymentStatus">,
  outcome: CancellationOutcome,
): string {
  if (booking.paymentStatus === PaymentStatus.Paid && outcome.refund > 0)
    return PaymentStatus.Refunded;
  return booking.paymentStatus;
}
