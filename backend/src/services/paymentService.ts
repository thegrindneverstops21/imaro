import { env } from "../config/env";
import { NotificationEvent } from "../constants/account";
import { notifyBooking } from "./notificationService";
import { PAYFAST } from "../constants/payfast";
import { HttpStatus } from "../constants/http";
import { ErrorMessage } from "../constants/messages";
import { withTransaction } from "../db/transaction";
import {
  isLiveHold,
  signature,
  validNotification,
  type PayfastFields,
} from "../domain/payfast";
import { Environment } from "../constants/domain";
import type { BookingAccess, BookingView } from "../domain/bookingTypes";
import { AppError } from "../middleware/error";
import * as bookings from "../repositories/bookingRepository";
import * as payments from "../repositories/paymentRepository";
import { getBooking } from "./bookingService";
import { verifyWithPayfast } from "./payfastGateway";

// PayFast is optional: without these env vars the payment routes say "not configured" instead of failing in a confusing way.
function configured() {
  return (
    env.PAYFAST_MERCHANT_ID &&
    env.PAYFAST_MERCHANT_KEY &&
    env.PAYFAST_NOTIFY_URL &&
    env.PAYFAST_RETURN_URL &&
    env.PAYFAST_CANCEL_URL
  );
}

function hasLocalCallbackUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol !== "https:" ||
      url.hostname === "localhost" ||
      url.hostname === "[::1]" ||
      url.hostname === "127.0.0.1"
    );
  } catch {
    return true;
  }
}

function assertPublicCallbacks() {
  if (
    env.NODE_ENV === Environment.Development &&
    [env.PAYFAST_NOTIFY_URL, env.PAYFAST_RETURN_URL, env.PAYFAST_CANCEL_URL].some(
      (url) => url && hasLocalCallbackUrl(url),
    )
  )
    throw new AppError(HttpStatus.ServiceUnavailable, ErrorMessage.PayFastPublicUrls);
}

function returnUrl(base: string, reference: string) {
  const url = new URL(base);
  url.searchParams.set("reference", reference);
  return url.toString();
}

function checkoutFields(booking: BookingView): PayfastFields {
  const [first = "", ...last] = booking.guest.name.trim().split(/\s+/);
  return {
    merchant_id: env.PAYFAST_MERCHANT_ID!,
    merchant_key: env.PAYFAST_MERCHANT_KEY!,
    return_url: returnUrl(env.PAYFAST_RETURN_URL!, booking.reference),
    cancel_url: returnUrl(env.PAYFAST_CANCEL_URL!, booking.reference),
    notify_url: env.PAYFAST_NOTIFY_URL!,
    name_first: first.slice(0, PAYFAST.fieldMax),
    name_last: last.join(" ").slice(0, PAYFAST.fieldMax),
    email_address: booking.guest.email,
    m_payment_id: booking.reference,
    amount: booking.totalAmount.toFixed(PAYFAST.moneyDecimals),
    item_name: `${PAYFAST.itemPrefix} ${booking.reference}`,
  };
}

// Builds the HTML form the browser posts to PayFast. The signature proves to PayFast that the amount and reference were set by us, not the browser.
export async function createPayment(reference: string, access: BookingAccess) {
  const booking = await getBooking(reference, access);
  const holdExpiresAt = booking.holdExpiresAt
    ? new Date(booking.holdExpiresAt)
    : null;
  if (!isLiveHold({ ...booking, holdExpiresAt }, new Date()))
    throw new AppError(HttpStatus.Conflict, ErrorMessage.HoldExpired);
  if (!configured())
    throw new AppError(HttpStatus.ServiceUnavailable, PAYFAST.notConfigured);
  assertPublicCallbacks();
  const fields = checkoutFields(booking);
  fields.signature = signature(fields, env.PAYFAST_PASSPHRASE);
  return {
    actionUrl: env.PAYFAST_SANDBOX
      ? PAYFAST.sandboxProcess
      : PAYFAST.liveProcess,
    fields,
  };
}

// Called by PayFast (not the browser). Silent `return`s mean "not a valid payment, ignore it" — we never throw here because PayFast would retry.
export async function receiveNotification(fields: PayfastFields) {
  if (!configured()) return;
  const booking = await bookings.findBooking(fields.m_payment_id ?? "");
  if (!booking || !isLiveHold(booking, new Date())) return;
  const expected = {
    merchantId: env.PAYFAST_MERCHANT_ID!,
    total: booking.totalAmount,
    passphrase: env.PAYFAST_PASSPHRASE,
  };
  if (
    !validNotification(fields, expected) ||
    !(await verifyWithPayfast(fields))
  )
    return;
  await settlePayment(fields);
}

// Marks the booking paid inside a transaction. `paymentExists` makes PayFast's retries harmless: the same payment id is only processed once.
async function settlePayment(fields: PayfastFields) {
  await withTransaction(async (db) => {
    if (await payments.paymentExists(db, fields.pf_payment_id!)) return;
    const booking = await bookings.findBookingForUpdate(
      db,
      fields.m_payment_id!,
    );
    if (!booking || !isLiveHold(booking, new Date())) return;
    if (
      booking.totalAmount.toFixed(PAYFAST.moneyDecimals) !== fields.amount_gross
    )
      return;
    if (!(await bookings.markPaidIfHeld(db, booking.id))) return;
    await payments.insertPayment(db, {
      bookingId: booking.id,
      reference: fields.pf_payment_id!,
      amount: booking.totalAmount,
    });
    await notifyBooking(db, booking, NotificationEvent.Payment);
  });
}
