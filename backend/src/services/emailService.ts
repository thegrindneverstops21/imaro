import { Resend } from "resend";
import { env } from "../config/env";
import {
  Environment,
  MS_PER_HOUR,
  PASSWORD_RESET_LIFETIME_MS,
} from "../constants/domain";
import type { BookingRow } from "../domain/bookingTypes";

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

const RESET_LIFETIME_HOURS = PASSWORD_RESET_LIFETIME_MS / MS_PER_HOUR;
const SIGN_OFF = "Stillmere Hotel";
const client = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Never throws: a failed email must not undo a booking, payment or reset.
export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!client) {
    if (env.NODE_ENV === Environment.Development)
      console.warn("RESEND_API_KEY not set, skipping email:", message.subject);
    return;
  }
  try {
    const { error } = await client.emails.send({
      from: env.EMAIL_FROM,
      ...message,
    });
    if (error) console.error("Email failed:", error.message);
  } catch (error) {
    console.error("Email failed:", error);
  }
}

export function sendBookingEmail(
  booking: BookingRow,
  content: { title: string; message: string },
) {
  return sendEmail({
    to: booking.guestEmail,
    subject: `${content.title} - ${booking.reference}`,
    text: [
      `Hi ${booking.guestName},`,
      content.message,
      `Booking reference: ${booking.reference}`,
      `Stay: ${booking.checkIn} to ${booking.checkOut}`,
      SIGN_OFF,
    ].join("\n\n"),
  });
}

export function sendPasswordResetEmail(to: string, token: string) {
  const link = `${env.CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to,
    subject: "Reset your Stillmere password",
    text: [
      "We received a request to reset your password.",
      `Open this link within ${RESET_LIFETIME_HOURS} hour to choose a new one:\n${link}`,
      "If you did not ask for this, you can ignore this email.",
      SIGN_OFF,
    ].join("\n\n"),
  });
}