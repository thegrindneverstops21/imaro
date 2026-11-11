import { NotificationText } from "../constants/account";
import { ErrorMessage } from "../constants/messages";
import { HttpStatus } from "../constants/http";
import type { Queryable } from "../db/pool";
import type { BookingRow } from "../domain/bookingTypes";
import { AppError } from "../middleware/error";
import * as repo from "../repositories/notificationRepository";
import { sendBookingEmail } from "./emailService";

// Saves the in-app notification, then emails the guest without waiting for it.
export async function notifyBooking(
  db: Queryable,
  booking: BookingRow,
  type: keyof typeof NotificationText,
) {
  const content = NotificationText[type];
  const saved = await repo.insertNotification(db, booking, { type, ...content });
  void sendBookingEmail(booking, content);
  return saved;
}
export const listNotifications = (id: number) => repo.listNotifications(id);
export async function readNotification(userId: number, id: number) {
  const notification = await repo.readNotification(userId, id);
  if (!notification)
    throw new AppError(HttpStatus.NotFound, ErrorMessage.ResourceNotFound);
  return notification;
}