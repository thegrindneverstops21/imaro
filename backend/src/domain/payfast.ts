import { createHash, timingSafeEqual } from "node:crypto";
import { PAYFAST } from "../constants/payfast";
import type { BookingRow } from "./bookingTypes";
import { BookingStatus, PaymentStatus } from "../constants/domain";

// PayFast has its own quirky URL-encoding rules, so `encodeURIComponent` alone is not enough — hence the extra replacements.
export type PayfastFields = Record<string, string>;
const encode = (value: string) =>
  encodeURIComponent(value.trim())
    .replace(
      /[!'()*~]/g,
      (char) =>
        `%${char.charCodeAt(0).toString(PAYFAST.hexBase).toUpperCase()}`,
    )
    .replace(/%20/g, "+");

// Builds the exact string PayFast hashes: `key=value&key=value` in the order the fields arrived, skipping the signature, with the passphrase last.

export function parameterString(
  fields: PayfastFields,
  passphrase = "",
  includeEmpty = false,
) {
  const parts = Object.entries(fields)
    .filter(
      ([key, value]) =>
        key !== "signature" && (includeEmpty || value.trim() !== ""),
    )
    .map(([key, value]) => `${encode(key)}=${encode(value)}`);
  if (passphrase) parts.push(`passphrase=${encode(passphrase)}`);
  return parts.join("&");
}

export const signature = (
  fields: PayfastFields,
  passphrase = "",
  includeEmpty = false,
) =>
  createHash("md5")
    .update(parameterString(fields, passphrase, includeEmpty))
    .digest("hex");

interface ExpectedPayment {
  merchantId: string;
  total: number;
  passphrase: string;
}
function validPaymentFields(fields: PayfastFields, expected: ExpectedPayment) {
  return (
    fields.merchant_id === expected.merchantId &&
    fields.payment_status === PAYFAST.complete &&
    Boolean(fields.m_payment_id) &&
    Boolean(fields.pf_payment_id) &&
    /^\d+\.\d{2}$/.test(fields.amount_gross ?? "") &&
    fields.amount_gross === expected.total.toFixed(PAYFAST.moneyDecimals)
  );
}

// Checks: signature shape, the payment details, then the signature itself. timingSafeEqual avoids leaking how much of the string matched via timing.
export function validNotification(
  fields: PayfastFields,
  expected: ExpectedPayment,
) {
  if (!fields.signature || !/^[a-f0-9]{32}$/.test(fields.signature))
    return false;
  if (!validPaymentFields(fields, expected)) return false;
  return timingSafeEqual(
    Buffer.from(fields.signature),
    Buffer.from(signature(fields, expected.passphrase, true)),
  );
}

// A payment is only allowed while the 15-minute hold is still running.
export function isLiveHold(
  booking: Pick<BookingRow, "status" | "paymentStatus" | "holdExpiresAt">,
  now: Date,
) {
  return (
    booking.status === BookingStatus.Held &&
    booking.paymentStatus === PaymentStatus.Unpaid &&
    booking.holdExpiresAt !== null &&
    booking.holdExpiresAt > now
  );
}
