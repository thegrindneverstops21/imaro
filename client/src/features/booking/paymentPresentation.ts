import type { Booking } from "../../types/api";

export function paymentPresentation(
  booking: Pick<Booking, "status" | "paymentStatus">,
) {
  const { status, paymentStatus } = booking;
  if (status === "cancelled")
    return {
      title: "Your reservation is cancelled.",
      body:
        paymentStatus === "refunded"
          ? "The hotel’s records show a refund. See your booking for the recorded payment details."
          : "See your booking for payment and cancellation details. Contact the hotel if you need help.",
      poll: false,
    };
  if (status === "expired")
    return {
      title: "Your room hold has expired.",
      body: "The rooms are no longer held. If you attempted payment, contact the hotel before paying again. Otherwise, search for availability again.",
      poll: false,
    };
  if (status === "confirmed")
    return {
      title: "Your stay is confirmed.",
      body: "The hotel has confirmed your reservation. View your booking details below.",
      poll: false,
    };
  if (status === "completed")
    return {
      title: "Your stay is complete.",
      body: "You can view the hotel’s reservation and payment records below.",
      poll: false,
    };
  if (paymentStatus === "paid" && status === "pending_approval")
    return {
      title: "Payment received.",
      body: "Your payment is recorded. Your reservation is awaiting hotel approval.",
      poll: false,
    };
  if (paymentStatus === "unpaid" && status === "held")
    return {
      title: "Checking your payment.",
      body: "We are waiting for PayFast’s verified notification. Please do not pay again while verification is pending.",
      poll: true,
    };
  return {
    title: "Check your reservation status.",
    body: "Open your booking for the latest payment and reservation details, or contact the hotel for help.",
    poll: false,
  };
}
