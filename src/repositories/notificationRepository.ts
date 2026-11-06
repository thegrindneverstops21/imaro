import { rows, type Queryable } from "../db/pool";
import type { BookingRow } from "../domain/bookingTypes";
import * as sql from "./notificationQueries";

export const insertNotification = (
  db: Queryable,
  booking: BookingRow,
  event: { type: string; title: string; message: string },
) =>
  rows(
    sql.INSERT_NOTIFICATION,
    [
      booking.userId,
      booking.guestEmail,
      booking.id,
      event.type,
      event.title,
      event.message,
    ],
    db,
  );
export const listNotifications = (userId: number) =>
  rows(sql.LIST_NOTIFICATIONS, [userId]);
export const readNotification = async (userId: number, id: number) =>
  (await rows(sql.READ_NOTIFICATION, [userId, id]))[0];
