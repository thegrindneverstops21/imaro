import { nightsBetween, quoteStay } from "./pricing";
import type {
  DatedStay,
  RoomTypeAvailabilityRow,
  RoomTypeDetails,
  RoomTypeView,
  Stay,
} from "./types";

export function hasDates(stay: Stay): stay is DatedStay {
  return Boolean(stay.checkIn && stay.checkOut);
}

// Guests are spread over as many rooms as capacity requires, never fewer than requested.
export function roomsNeeded(capacity: number, stay: Stay): number {
  return Math.max(stay.rooms, Math.ceil(stay.guests / capacity));
}

export function toRoomTypeView(
  row: RoomTypeAvailabilityRow,
  details: RoomTypeDetails,
  stay: Stay,
): RoomTypeView {
  const needed = roomsNeeded(row.capacity, stay);
  const view: RoomTypeView = {
    ...row,
    ...details,
    roomsNeeded: needed,
    canBook: row.availableRooms >= needed,
  };
  if (!hasDates(stay)) return view;

  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  return { ...view, ...quoteStay(row.pricePerNight, nights, needed) };
}
