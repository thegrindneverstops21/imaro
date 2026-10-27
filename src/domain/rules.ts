import { ISO_DATE_LENGTH, MAX_NIGHTS } from "../constants/domain";
import { StayMessage } from "../constants/messages";
import { nightsBetween } from "./pricing";

export interface StayIssue {
  field: "checkIn" | "checkOut";
  message: string;
}

export interface StayDates {
  checkIn?: string | undefined;
  checkOut?: string | undefined;
}

export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, ISO_DATE_LENGTH);
}

export function isRealIsoDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && todayIso(date) === value;
}

function checkInIssue(checkIn: string, today: string): StayIssue | null {
  if (checkIn >= today) return null;
  return { field: "checkIn", message: StayMessage.CheckInPast };
}

function checkOutIssue(checkIn: string, checkOut: string): StayIssue | null {
  if (checkOut <= checkIn)
    return { field: "checkOut", message: StayMessage.CheckOutOrder };
  if (nightsBetween(checkIn, checkOut) > MAX_NIGHTS) {
    return { field: "checkOut", message: StayMessage.MaxNights };
  }
  return null;
}

// Pure rules for a stay's dates. Returns every problem found; empty means valid.
export function validateStayDates(
  dates: StayDates,
  today: string,
): StayIssue[] {
  const { checkIn, checkOut } = dates;
  if (!checkIn && !checkOut) return [];
  if (!checkIn || !checkOut) {
    const missing = checkIn ? "checkOut" : "checkIn";
    return [{ field: missing, message: StayMessage.BothDatesRequired }];
  }
  return [
    checkInIssue(checkIn, today),
    checkOutIssue(checkIn, checkOut),
  ].filter((issue): issue is StayIssue => issue !== null);
}