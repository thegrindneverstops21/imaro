import type { Stay } from "../types/api";

export function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function nextDay(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function validDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateStay(stay: Stay, today = localToday()) {
  if (!stay.checkIn) return "Please enter your check-in date.";
  if (!stay.checkOut) return "Please enter your check-out date.";
  if (!validDate(stay.checkIn) || !validDate(stay.checkOut)) return "Choose valid check-in and check-out dates.";
  if (stay.checkIn < today) return "Check-in cannot be in the past.";
  if (stay.checkOut <= stay.checkIn) return "Check-out must be after check-in.";
  if ((Date.parse(stay.checkOut) - Date.parse(stay.checkIn)) / 86400000 > 30) return "Please choose a stay of 30 nights or fewer.";
  if (!Number.isInteger(stay.guests) || stay.guests < 1 || stay.guests > 10) return "Choose between 1 and 10 guests.";
  if (!Number.isInteger(stay.rooms) || stay.rooms < 1 || stay.rooms > 5) return "Choose between 1 and 5 rooms.";
  return "";
}

export function initialStay(saved: Stay, today = localToday()): Stay {
  const checkIn = validDate(saved.checkIn) && saved.checkIn >= today ? saved.checkIn : nextDay(today);
  const checkOut = validDate(saved.checkOut) && saved.checkOut > checkIn ? saved.checkOut : nextDay(checkIn);
  return {
    checkIn, checkOut,
    guests: Number.isInteger(saved.guests) && saved.guests >= 1 && saved.guests <= 10 ? saved.guests : 2,
    rooms: Number.isInteger(saved.rooms) && saved.rooms >= 1 && saved.rooms <= 5 ? saved.rooms : 1,
  };
}
