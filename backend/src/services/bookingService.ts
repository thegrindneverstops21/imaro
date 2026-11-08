import type { PoolClient } from "pg";
import { NotificationEvent } from "../constants/account";
import { notifyBooking } from "./notificationService";
import { env } from "../config/env";
import {
  BookingStatus,
  CURRENCY,
  Environment,
  PaymentStatus,
  PG_EXCLUSION_VIOLATION,
} from "../constants/domain";
import { HttpStatus } from "../constants/http";
import { ErrorMessage } from "../constants/messages";
import type { Queryable } from "../db/pool";
import { withTransaction } from "../db/transaction";
import {
  canAccessBooking,
  canCancel,
  holdExpiresAt,
  paymentStatusAfterCancel,
} from "../domain/bookingRules";
import type {
  BookingAccess,
  BookingRoomsInsert,
  BookingRow,
  BookingView,
  CancelResult,
  CreateBookingInput,
  CreatedBooking,
  FreeRoomSearch,
  NewBooking,
  PaymentResult,
  RoomOffer,
} from "../domain/bookingTypes";
import { previewCancellation, toBookingView } from "../domain/bookingView";
import { nightsBetween, quoteStay } from "../domain/pricing";
import { roomsNeeded } from "../domain/roomTypes";
import type { StayQuote } from "../domain/types";
import { todayIso } from "../domain/rules";
import { AppError } from "../middleware/error";
import * as repo from "../repositories/bookingRepository";
import {
  hashToken,
  newAccessToken,
  newBookingReference,
  tokenMatchesHash,
} from "../utils/secrets";

// Shorthand error builders used throughout this file.
const conflict = () =>
  new AppError(HttpStatus.Conflict, ErrorMessage.BookingConflict);
const notFound = () =>
  new AppError(HttpStatus.NotFound, ErrorMessage.BookingNotFound);

// Postgres refuses overlapping stays for the same room (the `no_double_booking`
// constraint). That error means "someone else booked it first" -> 409.
function isExclusionViolation(error: unknown): boolean {
  const code =
    typeof error === "object" && error !== null
      ? (error as { code?: string }).code
      : undefined;
  return code === PG_EXCLUSION_VIOLATION;
}

// ---------- Create ----------

export async function createBooking(
  input: CreateBookingInput,
  userId: number | null,
): Promise<CreatedBooking> {
  try {
    return await withTransaction((db) => placeHold(db, input, userId));
  } catch (error) {
    throw isExclusionViolation(error) ? conflict() : error;
  }
}

async function requireOffer(
  db: Queryable,
  input: CreateBookingInput,
): Promise<RoomOffer> {
  const offer = await repo.findRoomOffer(db, input.branchSlug, input.roomType);
  if (!offer)
    throw new AppError(HttpStatus.NotFound, ErrorMessage.RoomTypeNotOffered);
  return offer;
}

async function requireFreeRooms(
  db: Queryable,
  search: FreeRoomSearch,
): Promise<number[]> {
  const roomIds = await repo.findFreeRoomIds(db, search);
  if (roomIds.length < search.limit) throw conflict();
  return roomIds;
}

function toRoomSearch(
  offer: RoomOffer,
  input: CreateBookingInput,
  needed: number,
): FreeRoomSearch {
  const { branchId, roomTypeId } = offer;
  return {
    branchId,
    roomTypeId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    limit: needed,
  };
}

interface BookingParts {
  userId: number | null;
  tokenHash: string;
  total: number;
}

function toNewBooking(
  input: CreateBookingInput,
  offer: RoomOffer,
  parts: BookingParts,
): NewBooking {
  return {
    reference: newBookingReference(),
    branchId: offer.branchId,
    userId: parts.userId,
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    guestPhone: input.guestPhone,
    billingAddressLine1: input.addressLine1 ?? null,
    billingAddressLine2: input.addressLine2 ?? null,
    billingCity: input.city ?? null,
    billingProvince: input.province ?? null,
    billingPostalCode: input.postalCode ?? null,
    billingCountry: input.country ?? null,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    specialRequests: input.specialRequests ?? null,
    accessTokenHash: parts.tokenHash,
    totalAmount: parts.total,
    holdExpiresAt: holdExpiresAt(new Date()),
  };
}

interface Hold {
  booking: NewBooking;
  manageToken: string;
  pricePerNight: number;
  nights: number;
  quote: StayQuote;
}

interface HoldParts {
  userId: number | null;
  needed: number;
}

// Pure: prices the stay and prepares the booking record and its one-time manage token.
function buildHold(
  input: CreateBookingInput,
  offer: RoomOffer,
  parts: HoldParts,
): Hold {
  const nights = nightsBetween(input.checkIn, input.checkOut);
  const quote = quoteStay(offer.pricePerNight, nights, parts.needed);
  const manageToken = newAccessToken();
  const bookingParts = {
    userId: parts.userId,
    tokenHash: hashToken(manageToken),
    total: quote.totalPrice,
  };
  const booking = toNewBooking(input, offer, bookingParts);
  return {
    booking,
    manageToken,
    pricePerNight: offer.pricePerNight,
    nights,
    quote,
  };
}

function toRoomsInsert(
  bookingId: number,
  roomIds: number[],
  hold: Hold,
): BookingRoomsInsert {
  const { checkIn, checkOut } = hold.booking;
  return {
    bookingId,
    roomIds,
    pricePerNight: hold.pricePerNight,
    checkIn,
    checkOut,
  };
}

function toCreated(hold: Hold, roomsBooked: number): CreatedBooking {
  const { booking, manageToken, nights, quote } = hold;
  return {
    reference: booking.reference,
    manageToken,
    status: BookingStatus.Held,
    paymentStatus: PaymentStatus.Unpaid,
    totalAmount: booking.totalAmount,
    amountPaid: 0,
    balanceDue: booking.totalAmount,
    vatIncluded: quote.vatIncluded,
    currency: CURRENCY,
    nights,
    roomsBooked,
    holdExpiresAt: booking.holdExpiresAt.toISOString(),
  };
}

// Creates the booking in the "held" state: the rooms are blocked for 15 minutes
// while the guest pays. Unpaid holds are cleaned up by sweepExpiredHolds.
async function placeHold(
  db: PoolClient,
  input: CreateBookingInput,
  userId: number | null,
): Promise<CreatedBooking> {
  await repo.sweepExpiredHolds(db);
  const offer = await requireOffer(db, input);
  const needed = roomsNeeded(offer.capacity, input);
  const roomIds = await requireFreeRooms(
    db,
    toRoomSearch(offer, input, needed),
  );
  const hold = buildHold(input, offer, { userId, needed });
  const bookingId = await repo.insertBooking(db, hold.booking);
  await repo.insertBookingRooms(db, toRoomsInsert(bookingId, roomIds, hold));
  return toCreated(hold, needed);
}

// ---------- Read ----------
// NOTE: below, pure helpers like `toNewBooking`/`buildHold` do no I/O — they only
// shape data — while functions taking `db` do the database work. Keeping the two
// apart makes the logic much easier to follow and test.

// A wrong reference and a wrong token look identical, so references cannot be probed.
export async function requireAccessible(
  load: () => Promise<BookingRow | null>,
  access: BookingAccess,
): Promise<BookingRow> {
  const booking = await load();
  if (!booking) throw notFound();
  const tokenMatches = tokenMatchesHash(access.token, booking.accessTokenHash);
  if (!canAccessBooking(booking.userId, access, tokenMatches)) throw notFound();
  return booking;
}

export async function getBooking(
  reference: string,
  access: BookingAccess,
): Promise<BookingView> {
  const booking = await requireAccessible(
    () => repo.findBooking(reference),
    access,
  );
  const rooms = await repo.findRoomSummary(booking.id);
  return toBookingView(booking, rooms, new Date());
}

// ---------- Cancel ----------

export function cancelBooking(
  reference: string,
  access: BookingAccess,
): Promise<CancelResult> {
  return withTransaction((db) => cancelInTransaction(db, reference, access));
}

async function cancelInTransaction(
  db: PoolClient,
  reference: string,
  access: BookingAccess,
): Promise<CancelResult> {
  const booking = await requireAccessible(
    () => repo.findBookingForUpdate(db, reference),
    access,
  );
  const now = new Date();
  if (!canCancel(booking, todayIso(now)))
    throw new AppError(HttpStatus.Conflict, ErrorMessage.CannotCancel);
  const rooms = await repo.findRoomSummary(booking.id, db);
  const cancellation = previewCancellation(booking, rooms, now);
  const paymentStatus = paymentStatusAfterCancel(booking, cancellation);
  await repo.recordCancellation(db, booking.id, cancellation);
  await repo.markCancelled(db, booking.id, paymentStatus);
  await notifyBooking(db, booking, NotificationEvent.Cancellation);
  return {
    reference,
    status: BookingStatus.Cancelled,
    paymentStatus,
    cancellation,
  };
}

// ---------- Simulated payment (development and tests only) ----------

export async function simulatePayment(
  reference: string,
  access: BookingAccess,
): Promise<PaymentResult> {
  if (env.NODE_ENV === Environment.Production) {
    throw new AppError(HttpStatus.NotFound, ErrorMessage.RouteNotFound);
  }
  return withTransaction((db) => payInTransaction(db, reference, access));
}

async function payInTransaction(
  db: PoolClient,
  reference: string,
  access: BookingAccess,
): Promise<PaymentResult> {
  const booking = await requireAccessible(
    () => repo.findBookingForUpdate(db, reference),
    access,
  );
  const paid = await repo.markPaidIfHeld(db, booking.id);
  if (!paid) throw new AppError(HttpStatus.Conflict, ErrorMessage.HoldExpired);
  await repo.insertSimulatedPayment(db, {
    bookingId: booking.id,
    amount: booking.totalAmount,
  });
  await notifyBooking(db, booking, NotificationEvent.Payment);
  return {
    reference,
    status: BookingStatus.PendingApproval,
    paymentStatus: PaymentStatus.Paid,
    simulated: true,
  };
}
