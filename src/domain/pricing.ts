import {
  MONEY_PRECISION,
  MS_PER_DAY,
  PERCENT_BASE,
  VAT_PERCENT,
} from "../constants/domain";
import type { StayQuote } from "./types";

export const round2 = (amount: number): number =>
  Math.round((amount + Number.EPSILON) * MONEY_PRECISION) / MONEY_PRECISION;

// Both inputs are YYYY-MM-DD; they parse as UTC so daylight saving never skews the count.
export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / MS_PER_DAY);
}

// Room prices already include VAT, so back it out of the total.
export function vatPortion(total: number): number {
  return round2((total * VAT_PERCENT) / (PERCENT_BASE + VAT_PERCENT));
}

export function quoteStay(
  pricePerNight: number,
  nights: number,
  rooms: number,
): StayQuote {
  const totalPrice = round2(pricePerNight * nights * rooms);
  return { nights, totalPrice, vatIncluded: vatPortion(totalPrice) };
}
