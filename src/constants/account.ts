export const ACCOUNT_LIMITS = {
  reviewMax: 1000,
  nameMin: 2,
  ratingMin: 1,
  ratingMax: 5,
  pageDefault: 20,
  pageMax: 100,
} as const;
export const REVIEW_UNAVAILABLE =
  "Reviews are available after checkout for confirmed or completed stays";
export const NotificationEvent = {
  Payment: "payment",
  Approval: "approval",
  Cancellation: "cancellation",
  Modification: "modification",
} as const;
export const NotificationText = {
  payment: {
    title: "Payment received",
    message: "Your payment was received. Your stay is awaiting approval.",
  },
  approval: {
    title: "Booking approved",
    message: "Your stay has been approved.",
  },
  cancellation: {
    title: "Booking cancelled",
    message: "Your reservation has been cancelled.",
  },
  modification: {
    title: "Booking updated",
    message:
      "Your reservation details have changed. Please review your stay and balance.",
  },
} as const;
