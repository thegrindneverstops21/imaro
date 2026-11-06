export type AdminRoom = {
  id: number;
  roomTypeId: number;
  roomType: string;
  roomNumber: string;
  status: string;
};

export type Price = {
  roomTypeId: number;
  roomType: string;
  name: string;
  pricePerNight: number;
};

export type RoomTypeOption = { roomTypeId: number; name: string };

export type Tab = "reservations" | "rooms" | "rates" | "branches";

export const TABS: { key: Tab; title: string }[] = [
  { key: "reservations", title: "Reservations" },
  { key: "rooms", title: "Rooms" },
  { key: "rates", title: "Rates" },
  { key: "branches", title: "Branches" },
];

export const BOOKING_STATUSES = [
  "held",
  "pending_approval",
  "confirmed",
  "cancelled",
  "completed",
  "expired",
];

export const CLOSED_BOOKING_STATUSES = ["cancelled", "expired", "completed"];

export const readable = (value: string) => value.replaceAll("_", " ");