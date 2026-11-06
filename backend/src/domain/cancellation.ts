import {
  CANCELLATION_DEADLINE_HOUR,
  FREE_CANCELLATION_DAYS,
  HOTEL_UTC_OFFSET_HOURS,
  MS_PER_DAY,
  MS_PER_HOUR,
} from "../constants/domain";
import { round2 } from "./pricing";

export interface CancellationInput {
  checkIn: string;
  now: Date;
  firstNightCharge: number;
  amountPaid: number;
}

export interface CancellationOutcome {
  freeCancellation: boolean;
  deadline: string;
  fee: number;
  refund: number;
}
// Free cancellation ends at 14:00 hotel time (SAST), two days before check-in.
// The code defaults to midnight UTC, so we add 2 hours to match the hotel's 14:00 deadline.
export function freeCancellationDeadline(checkIn: string): Date {
  const hoursIntoDay = CANCELLATION_DEADLINE_HOUR - HOTEL_UTC_OFFSET_HOURS;
  const startOfCheckIn = Date.parse(checkIn);
  return new Date(
    startOfCheckIn -
      FREE_CANCELLATION_DAYS * MS_PER_DAY +
      hoursIntoDay * MS_PER_HOUR,
  );
}

// Inside the free window nothing is kept; after it the first night is charged.
export function cancellationOutcome(
  input: CancellationInput,
): CancellationOutcome {
  const deadline = freeCancellationDeadline(input.checkIn);
  const base = { deadline: deadline.toISOString() };
  if (input.now.getTime() <= deadline.getTime()) {
    return {
      ...base,
      freeCancellation: true,
      fee: 0,
      refund: round2(input.amountPaid),
    };
  }
  const fee = round2(input.firstNightCharge);
  return {
    ...base,
    freeCancellation: false,
    fee,
    refund: round2(Math.max(input.amountPaid - fee, 0)),
  };
}
