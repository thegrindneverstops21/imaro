import { MAX_NIGHTS } from "./domain";
import { MAX_IMAGE_MB } from "./upload";

export const ErrorMessage = {
  ResourceNotFound: "Resource not found",
  ResourceExists: "Resource already exists",
  InvalidReference: "Referenced resource does not exist or is still in use",
  AdminConflict:
    "The requested change conflicts with another booking or existing data",
  RoomNotFound: "Room not found",
  RoomReserved: "Room has current or future reservations",
  CapacityExceeded: "Guest count exceeds reserved room capacity",
  ImageTooLarge: `Choose an image smaller than ${MAX_IMAGE_MB} MB.`,
  ImageType: "Please choose a JPEG, PNG or WebP image.",
  NoReplacementRooms: "No rooms available for the changed stay",
  ApprovalStatus: "Only paid reservations awaiting approval can be approved",
  ApprovalPayment: "Reservation must be paid before approval",
  ModificationStatus: "Only pending or confirmed reservations can be modified",
  InvalidDates: "Dates must be valid YYYY-MM-DD values",
  EmptyPatch: "Provide at least one field",
  DateFilterOrder: "dateTo must be on or after dateFrom",
  RouteNotFound: "Route not found",
  BranchNotFound: "Branch not found",
  BookingNotFound: "Booking not found",
  ReviewNotFound: "Review not found",
  RoomTypeNotOffered: "That room type is not available at this branch",
  BookingConflict: "Those rooms are no longer available for your dates",
  CannotCancel: "This booking can no longer be cancelled",
  HoldExpired: "Booking hold has expired or is no longer payable",
  ManageTokenRequired:
    "Booking manage token required in x-booking-token header",
  SignInRequired: "Sign in required",
  EmailAlreadyRegistered:
    "That email already has an account. Sign in instead, or continue with Google.",
  InvalidCredentials: "Email or password is incorrect",
  InvalidResetToken: "This password reset link is invalid or has expired",
  AdminRequired: "Admin access required",
  GoogleNotConfigured: "Google sign-in is not configured",
  InvalidOAuthState: "Invalid or expired sign-in attempt, please try again",
  GoogleSignInFailed: "Google sign-in failed",
  GoogleEmailUnverified: "Google email is not verified",
  ValidationFailed: "Validation failed",
  Unexpected: "Something went wrong",
} as const;

export const StayMessage = {
  DateFormat: "Use YYYY-MM-DD",
  InvalidDate: "Not a real calendar date",
  BothDatesRequired: "Provide both checkIn and checkOut",
  CheckInPast: "checkIn cannot be in the past",
  CheckOutOrder: "checkOut must be after checkIn",
  MaxNights: `Maximum stay is ${MAX_NIGHTS} nights`,
} as const;