import type { BookingFilters, BookingListItem } from "../domain/bookingTypes";
import * as queries from "./adminQueries";
import type { Queryable } from "../db/pool";
import { rows } from "../db/pool";
import type {
  BranchInput,
  BranchPatch,
  RoomInput,
  RoomPatch,
} from "../validation/admin";

// $1 is the row id in every UPDATE, so the first patched column is $2.
const FIRST_UPDATE_PARAMETER = 2;

export const listBranches = () => rows(queries.LIST_BRANCHES);
export const getBranch = async (id: number, db?: Queryable) =>
  (await rows(queries.GET_BRANCH, [id], db))[0] ?? null;

export async function createBranch(input: BranchInput, db?: Queryable) {
  const result = await rows(
    queries.CREATE_BRANCH,
    [
      input.slug,
      input.name,
      input.description,
      input.address,
      input.city,
      input.lat,
      input.lng,
      input.phone,
      input.email,
      input.starRating,
      input.checkInTime,
      input.checkOutTime,
      input.isPublished,
    ],
    db,
  );
  return result[0];
}

const branchPatchColumns: Record<keyof BranchPatch, string> = {
  slug: "slug",
  name: "name",
  description: "description",
  address: "address",
  city: "city",
  lat: "lat",
  lng: "lng",
  phone: "phone",
  email: "email",
  starRating: "star_rating",
  checkInTime: "check_in_time",
  checkOutTime: "check_out_time",
  isPublished: "is_published",
};
export async function updateBranch(
  id: number,
  patch: BranchPatch,
  db?: Queryable,
) {
  const entries = Object.entries(patch) as [keyof BranchPatch, unknown][];
  if (!entries.length) return getBranch(id, db);
  const assignments = entries
    .map(
      ([key], index) =>
        `${branchPatchColumns[key]} = $${index + FIRST_UPDATE_PARAMETER}`,
    )
    .join(", ");
  const result = await rows(
    queries.UPDATE_BRANCH(assignments),
    [id, ...entries.map(([, value]) => value)],
    db,
  );
  return result[0] ?? null;
}
export async function unpublishBranch(id: number, db?: Queryable) {
  const result = await rows(queries.UNPUBLISH_BRANCH, [id], db);
  return result[0] ?? null;
}

export const listRooms = (branchId: number) =>
  rows(queries.LIST_ROOMS, [branchId]);
export async function createRoom(
  branchId: number,
  input: RoomInput,
  db?: Queryable,
) {
  const result = await rows(
    queries.CREATE_ROOM,
    [branchId, input.roomTypeId, input.roomNumber, input.status],
    db,
  );
  return result[0];
}
const roomPatchColumns: Record<keyof RoomPatch, string> = {
  roomTypeId: "room_type_id",
  roomNumber: "room_number",
  status: "status",
};
export async function updateRoom(id: number, patch: RoomPatch, db?: Queryable) {
  const entries = Object.entries(patch) as [keyof RoomPatch, unknown][];
  const assignments = entries
    .map(
      ([key], index) =>
        `${roomPatchColumns[key]} = $${index + FIRST_UPDATE_PARAMETER}`,
    )
    .join(", ");
  const result = await rows(
    queries.UPDATE_ROOM(assignments),
    [id, ...entries.map(([, value]) => value)],
    db,
  );
  return result[0] ?? null;
}
export const listPrices = (branchId: number) =>
  rows(queries.LIST_PRICES, [branchId]);
interface PriceUpsert {
  branchId: number;
  roomTypeId: number;
  price: number;
  db?: Queryable;
}
export async function upsertPrice({
  branchId,
  roomTypeId,
  price,
  db,
}: PriceUpsert) {
  const result = await rows(
    queries.UPSERT_PRICE,
    [branchId, roomTypeId, price],
    db,
  );
  return result[0];
}
export async function deletePrice(
  branchId: number,
  roomTypeId: number,
  db?: Queryable,
) {
  const result = await rows(queries.DELETE_PRICE, [branchId, roomTypeId], db);
  return result.length > 0;
}

export async function approveBooking(id: number, db: Queryable) {
  const result = await rows(queries.APPROVE_BOOKING, [id], db);
  return result[0] ?? null;
}

export async function findRoomForUpdate(id: number, db: Queryable) {
  const [room] = await rows<{ roomTypeId: number }>(
    queries.ROOM_FOR_UPDATE,
    [id],
    db,
  );
  return room ?? null;
}

export async function hasLiveReservations(
  id: number,
  today: string,
  db: Queryable,
) {
  const reservations = await rows(queries.LIVE_RESERVATIONS, [id, today], db);
  return reservations.length > 0;
}

export interface Allocation {
  roomTypeId: number;
  branchId: number;
  capacity: number;
  price: number;
}
export interface StayChange {
  checkIn: string;
  checkOut: string;
  guests: number;
}

export const findAllocations = (id: number, db: Queryable) =>
  rows<Allocation>(queries.BOOKING_ALLOCATIONS, [id], db);

export const clearAllocations = (id: number, db: Queryable) =>
  rows(queries.CLEAR_ALLOCATIONS, [id], db);

export async function updateBooking(
  id: number,
  change: StayChange & { total: number },
  db: Queryable,
) {
  await rows(
    queries.UPDATE_BOOKING,
    [id, change.checkIn, change.checkOut, change.guests, change.total],
    db,
  );
}

export async function findReservations(filters: BookingFilters) {
  const params = [
    filters.limit,
    filters.offset,
    filters.status ?? null,
    filters.paymentStatus ?? null,
    filters.branchId ?? null,
    filters.search ?? null,
    filters.dateFrom ?? null,
    filters.dateTo ?? null,
  ];
  const [page] = await rows<{ data: BookingListItem[]; total: number }>(
    queries.RESERVATIONS,
    params,
  );
  return page!;
}

export const findAssignedRooms = (id: number) =>
  rows(queries.ASSIGNED_ROOMS, [id]);
export const findPayments = (id: number) =>
  rows(queries.BOOKING_PAYMENTS, [id]);
