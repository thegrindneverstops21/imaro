import { NotificationText } from "../constants/account";
import { ErrorMessage } from "../constants/messages";
import { HttpStatus } from "../constants/http";
import type { Queryable } from "../db/pool";
import type { BookingRow } from "../domain/bookingTypes";
import { AppError } from "../middleware/error";
import * as repo from "../repositories/notificationRepository";

export const notifyBooking = (
  db: Queryable,
  booking: BookingRow,
  type: keyof typeof NotificationText,
) => repo.insertNotification(db, booking, { type, ...NotificationText[type] });
export const listNotifications = (id: number) => repo.listNotifications(id);
export async function readNotification(userId: number, id: number) {
  const notification = await repo.readNotification(userId, id);
  if (!notification)
    throw new AppError(HttpStatus.NotFound, ErrorMessage.ResourceNotFound);
  return notification;
}
