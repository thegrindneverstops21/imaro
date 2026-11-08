import { amountPaid, canCancel, firstNightCharge } from "./bookingRules";
import type { BookingRow, BookingView, RoomSummary } from "./bookingTypes";
import { cancellationOutcome } from "./cancellation";
import { nightsBetween, round2, vatPortion } from "./pricing";
import { todayIso } from "./rules";

// "If I cancelled right now, what would it cost me?"
export function previewCancellation(
  booking: BookingRow,
  rooms: RoomSummary[],
  now: Date,
) {
  return cancellationOutcome({
    checkIn: booking.checkIn,
    now,
    firstNightCharge: firstNightCharge(rooms),
    amountPaid: amountPaid(booking),
  });
}

function billingAddress(booking: BookingRow): BookingView["billingAddress"] {
  if (!booking.billingAddressLine1) return null;
  return {
    addressLine1: booking.billingAddressLine1,
    addressLine2: booking.billingAddressLine2 ?? null,
    city: booking.billingCity ?? "",
    province: booking.billingProvince ?? "",
    postalCode: booking.billingPostalCode ?? "",
    country: booking.billingCountry ?? "",
  };
}

// What a guest sees about a booking, including what cancelling would cost right now.
export function toBookingView(
  booking: BookingRow,
  rooms: RoomSummary[],
  now: Date,
): BookingView {
  const cancellable = canCancel(booking, todayIso(now));
  return {
    reference: booking.reference,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    branch: { slug: booking.branchSlug, name: booking.branchName },
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: nightsBetween(booking.checkIn, booking.checkOut),
    guests: booking.guests,
    totalAmount: booking.totalAmount,
    amountPaid: booking.amountPaid ?? 0,
    balanceDue: round2(booking.totalAmount - (booking.amountPaid ?? 0)),
    vatIncluded: vatPortion(booking.totalAmount),
    holdExpiresAt: booking.holdExpiresAt?.toISOString() ?? null,
    guest: {
      name: booking.guestName,
      email: booking.guestEmail,
      phone: booking.guestPhone,
    },
    billingAddress: billingAddress(booking),
    rooms,
    cancellation: cancellable ? previewCancellation(booking, rooms, now) : null,
  };
}
