import { MAX_NIGHTS } from "./domain";

export const ErrorMessage = {
  RouteNotFound: "Route not found",
  BranchNotFound: "Branch not found",
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
