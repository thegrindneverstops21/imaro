/**
 * ADMIN SERVICE
 *
 * Management actions for staff. The interesting parts are the guards:
 *  - a room cannot change type or go into maintenance while it has live bookings
 *  - a booking can only be approved once it is paid
 *  - changing dates/guest counts re-allocates physical rooms and re-prices the stay
 *
 * "lockBooking"/"findRoomForUpdate" read the row with SELECT ... FOR UPDATE so two
 * admins clicking at the same time cannot corrupt the same record.
 */
import { BookingStatus, RoomStatus } from "../constants/domain";
import { NotificationEvent } from "../constants/account";
import { notifyBooking } from "./notificationService";
import { ErrorMessage } from "../constants/messages";
import { nightsBetween, round2 } from "../domain/pricing";
import type { BookingRow, BookingFilters } from "../domain/bookingTypes";
import { HttpStatus } from "../constants/http";
import type { Queryable } from "../db/pool";
import { withTransaction } from "../db/transaction";
import { isRealIsoDate, todayIso, validateStayDates } from "../domain/rules";
import { AppError } from "../middleware/error";
import * as bookings from "../repositories/bookingRepository";
import { canCancel, paymentStatusAfterCancel } from "../domain/bookingRules";
import { previewCancellation, toBookingView } from "../domain/bookingView";
import * as repo from "../repositories/adminRepository";
import type {
  BookingUpdate,
  BranchInput,
  BranchPatch,
  RoomInput,
  RoomPatch,
} from "../validation/admin";

const notFound = (): never => { throw new AppError(HttpStatus.NotFound, ErrorMessage.ResourceNotFound); };
const conflict = () =>
  new AppError(
    HttpStatus.Conflict,
    ErrorMessage.AdminConflict,
  );
export const listBranches = () => repo.listBranches();
export const createBranch = (input: BranchInput) => repo.createBranch(input);
export async function updateBranch(id: number, patch: BranchPatch) {
  return (await repo.updateBranch(id, patch)) ?? notFound();
}
export async function unpublishBranch(id: number) {
  return (await repo.unpublishBranch(id)) ?? notFound();
}
export const listRooms = (branchId: number) => repo.listRooms(branchId);
export const createRoom = (branchId: number, input: RoomInput) =>
  repo.createRoom(branchId, input);
export async function updateRoom(id: number, patch: RoomPatch) {
  return withTransaction(async (db) => {
    await guardRoomChange(id, patch, db);
    return (await repo.updateRoom(id, patch, db)) ?? notFound();
  });
}
export async function setRoomMaintenance(id: number) {
  return updateRoom(id, { status: RoomStatus.Maintenance });
}
export const listPrices = (branchId: number) => repo.listPrices(branchId);
export const setPrice = (branchId: number, roomTypeId: number, price: number) =>
  repo.upsertPrice({ branchId, roomTypeId, price });
export async function removePrice(branchId: number, roomTypeId: number) {
  if (!(await repo.deletePrice(branchId, roomTypeId))) return notFound();
  return { branchId, roomTypeId, removed: true };
}

async function lockBooking(reference: string, db: Queryable) {
  const booking = await bookings.findBookingForUpdate(db, reference);
  if (!booking) return notFound();
  return booking;
}

export async function approveReservation(reference: string) {
  return withTransaction(async (db) => {
    const booking = await lockBooking(reference, db);
    if (booking.status !== BookingStatus.PendingApproval)
      throw new AppError(
        HttpStatus.Conflict,
        ErrorMessage.ApprovalStatus,
      );
    const approved = await repo.approveBooking(booking.id, db);
    if (!approved)
      throw new AppError(
        HttpStatus.Conflict,
        ErrorMessage.ApprovalPayment,
      );
    await notifyBooking(db, booking, NotificationEvent.Approval);
    return approved;
  });
}

export async function modifyReservation(
  reference: string,
  update: BookingUpdate,
) {
  return withTransaction((db) => modifyReservationInTransaction(reference, update, db));
}

async function modifyReservationInTransaction(
  reference: string,
  update: BookingUpdate,
  db: Queryable,
) {
  await bookings.sweepExpiredHolds(db);
  const booking = await lockBooking(reference, db);
  if (booking.status !== BookingStatus.PendingApproval && booking.status !== BookingStatus.Confirmed) {
    throw new AppError(HttpStatus.Conflict, ErrorMessage.ModificationStatus);
  }
  if (booking.checkIn <= todayIso()) throw conflict();
  const checkIn = update.checkIn ?? booking.checkIn;
  const checkOut = update.checkOut ?? booking.checkOut;
  validateModificationDates(checkIn, checkOut);
  const result = await reallocateBooking(booking, { checkIn, checkOut, guests: update.guests ?? booking.guests }, db);
  if (!result) return notFound();
  await notifyBooking(db, booking, NotificationEvent.Modification);
  return result;
}

export async function cancelReservation(reference: string) {
  return withTransaction(async (db) => {
    const booking = await lockBooking(reference, db);
    const now = new Date();
    if (!canCancel(booking, todayIso(now))) throw conflict();
    const rooms = await bookings.findRoomSummary(booking.id, db);
    const cancellation = previewCancellation(booking, rooms, now);
    const paymentStatus = paymentStatusAfterCancel(booking, cancellation);
    await bookings.recordCancellation(db, booking.id, cancellation);
    await bookings.markCancelled(db, booking.id, paymentStatus);
    await notifyBooking(db, booking, NotificationEvent.Cancellation);
    return { reference, status: BookingStatus.Cancelled, paymentStatus, cancellation };
  });
}

export async function getReservation(reference: string) {
  const booking = await bookings.findBooking(reference);
  if (!booking) return notFound();
  return {
    ...toBookingView(booking, await bookings.findRoomSummary(booking.id), new Date()),
    specialRequests: booking.specialRequests,
    assignedRooms: await repo.findAssignedRooms(booking.id),
    payments: await repo.findPayments(booking.id),
  };
}

// Reuses the same date rules as a new booking, but throws instead of returning a list.
function validateModificationDates(checkIn: string, checkOut: string) {
  if (!isRealIsoDate(checkIn) || !isRealIsoDate(checkOut)) {
    throw new AppError(HttpStatus.BadRequest, ErrorMessage.InvalidDates);
  }
  const [dateIssue] = validateStayDates({ checkIn, checkOut }, todayIso());
  if (dateIssue) throw new AppError(HttpStatus.BadRequest, dateIssue.message);
}

async function guardRoomChange(id: number, patch: RoomPatch, db: Queryable) {
  const room = await repo.findRoomForUpdate(id, db);
  if (!room) throw new AppError(HttpStatus.NotFound, ErrorMessage.RoomNotFound);
  if (patch.status !== RoomStatus.Maintenance &&
      (patch.roomTypeId === undefined || patch.roomTypeId === room.roomTypeId)) return;
  if (await repo.hasLiveReservations(id, todayIso(), db))
    throw new AppError(HttpStatus.Conflict, ErrorMessage.RoomReserved);
}

// Moves a booking to new dates: frees the old rooms, finds new free ones of the
// same type, then recalculates the total for the new number of nights.
async function reallocateBooking(booking: BookingRow, stay: repo.StayChange, db: Queryable) {
  const allocations = await repo.findAllocations(booking.id, db);
  const capacity = allocations.reduce((sum, room) => sum + room.capacity, 0);
  if (!allocations.length || stay.guests > capacity)
    throw new AppError(HttpStatus.BadRequest, ErrorMessage.CapacityExceeded);
  await repo.clearAllocations(booking.id, db);
  for (const room of allocations) {
    const ids = await bookings.findFreeRoomIds(db, { ...stay, ...room, limit: 1 });
    if (!ids.length) throw new AppError(HttpStatus.Conflict, ErrorMessage.NoReplacementRooms);
    await bookings.insertBookingRooms(db, { bookingId: booking.id, roomIds: ids,
      pricePerNight: room.price, checkIn: stay.checkIn, checkOut: stay.checkOut });
  }
  const total = round2(allocations.reduce((sum, room) => sum + room.price, 0) * nightsBetween(stay.checkIn, stay.checkOut));
  await repo.updateBooking(booking.id, { ...stay, total }, db);
  return toBookingView({ ...booking, ...stay, totalAmount: total },
    await bookings.findRoomSummary(booking.id, db), new Date());
}

export async function listReservations(filters: BookingFilters) {
  const { data, total } = await repo.findReservations(filters);
  return { data, meta: { total, limit: filters.limit, offset: filters.offset } };
}
