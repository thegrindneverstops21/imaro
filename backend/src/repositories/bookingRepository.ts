import { pool, rows, type Queryable } from "../db/pool";
import type {
  BookingRoomsInsert,
  BookingRow,
  FreeRoomSearch,
  NewBooking,
  PaymentInsert,
  RoomOffer,
  RoomSummary,
} from "../domain/bookingTypes";
import type { CancellationOutcome } from "../domain/cancellation";
import { PaymentProvider, PaymentRecordStatus } from "../constants/domain";
import {
  RECORD_CANCELLATION,
  BOOKING_BY_REFERENCE,
  BOOKING_BY_REFERENCE_FOR_UPDATE,
  DEACTIVATE_ROOMS,
  FREE_ROOM_IDS,
  INSERT_BOOKING,
  INSERT_BOOKING_ROOMS,
  INSERT_PAYMENT,
  MARK_CANCELLED,
  MARK_PAID_IF_HELD,
  ROOM_OFFER,
  ROOM_SUMMARY,
  SWEEP_EXPIRED_HOLDS,
} from "./bookingQueries";

// Database access only: no business rules live here.
// Frees rooms from unpaid holds whose 15 minutes ran out.
export async function sweepExpiredHolds(db: Queryable): Promise<void> {
  await rows(SWEEP_EXPIRED_HOLDS, [], db);
}

export async function findRoomOffer(
  db: Queryable,
  branchSlug: string,
  roomType: string,
): Promise<RoomOffer | null> {
  const [offer] = await rows<RoomOffer>(ROOM_OFFER, [branchSlug, roomType], db);
  return offer ?? null;
}

export async function findFreeRoomIds(
  db: Queryable,
  search: FreeRoomSearch,
): Promise<number[]> {
  const params = [
    search.branchId,
    search.roomTypeId,
    search.checkIn,
    search.checkOut,
    search.limit,
  ];
  const found = await rows<{ id: number }>(FREE_ROOM_IDS, params, db);
  return found.map((room) => room.id);
}

function toInsertParams(booking: NewBooking): unknown[] {
  return [
    booking.reference,
    booking.branchId,
    booking.userId,
    booking.guestName,
    booking.guestEmail,
    booking.guestPhone,
    booking.billingAddressLine1,
    booking.billingAddressLine2,
    booking.billingCity,
    booking.billingProvince,
    booking.billingPostalCode,
    booking.billingCountry,
    booking.checkIn,
    booking.checkOut,
    booking.guests,
    booking.specialRequests,
    booking.accessTokenHash,
    booking.totalAmount,
    booking.holdExpiresAt,
  ];
}

export async function insertBooking(
  db: Queryable,
  booking: NewBooking,
): Promise<number> {
  const [created] = await rows<{ id: number }>(
    INSERT_BOOKING,
    toInsertParams(booking),
    db,
  );
  return created!.id;
}

export async function insertBookingRooms(
  db: Queryable,
  insert: BookingRoomsInsert,
): Promise<void> {
  const params = [
    insert.bookingId,
    insert.roomIds,
    insert.pricePerNight,
    insert.checkIn,
    insert.checkOut,
  ];
  await rows(INSERT_BOOKING_ROOMS, params, db);
}

export async function findBooking(
  reference: string,
  db: Queryable = pool,
): Promise<BookingRow | null> {
  const [booking] = await rows<BookingRow>(
    BOOKING_BY_REFERENCE,
    [reference],
    db,
  );
  return booking ?? null;
}

export async function findBookingForUpdate(
  db: Queryable,
  reference: string,
): Promise<BookingRow | null> {
  const [booking] = await rows<BookingRow>(
    BOOKING_BY_REFERENCE_FOR_UPDATE,
    [reference],
    db,
  );
  return booking ?? null;
}

export const findRoomSummary = (bookingId: number, db: Queryable = pool) =>
  rows<RoomSummary>(ROOM_SUMMARY, [bookingId], db);

export async function markCancelled(
  db: Queryable,
  bookingId: number,
  paymentStatus: string,
): Promise<void> {
  await rows(MARK_CANCELLED, [bookingId, paymentStatus], db);
  await rows(DEACTIVATE_ROOMS, [bookingId], db);
}

// Returns true only if a row actually changed, i.e. the hold was still valid.
export async function markPaidIfHeld(
  db: Queryable,
  bookingId: number,
): Promise<boolean> {
  const updated = await rows(MARK_PAID_IF_HELD, [bookingId], db);
  return updated.length > 0;
}

export async function insertSimulatedPayment(
  db: Queryable,
  payment: PaymentInsert,
): Promise<void> {
  const payload = JSON.stringify({ outcome: "success", simulated: true });
  await rows(
    INSERT_PAYMENT,
    [payment.bookingId, PaymentProvider.Simulated, payment.amount, payload],
    db,
  );
}

// Only simulation is implemented. Persist the refund and fee for accounting and audit.
export async function recordCancellation(
  db: Queryable,
  bookingId: number,
  outcome: CancellationOutcome,
) {
  await rows(
    RECORD_CANCELLATION,
    [
      bookingId,
      PaymentProvider.Simulated,
      outcome.refund,
      PaymentRecordStatus.Refunded,
      JSON.stringify({ ...outcome, simulated: true }),
    ],
    db,
  );
}
