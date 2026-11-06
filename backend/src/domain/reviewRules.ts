import { BookingStatus } from "../constants/domain";

export const canReview = (
  booking: { status: string; checkOut: string },
  today: string,
) =>
  (booking.status === BookingStatus.Confirmed ||
    booking.status === BookingStatus.Completed) &&
  booking.checkOut < today;
