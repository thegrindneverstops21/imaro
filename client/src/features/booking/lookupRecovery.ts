const NOT_MATCHED_STATUSES = new Set([401, 403, 404]);

const NOT_MATCHED =
  "We couldn’t find a reservation that matches that reference and token. Check both against your confirmation, or sign in with the account that made the booking.";
const UNREACHABLE =
  "We couldn’t reach the hotel’s system. Check your connection and try again.";
const SERVER_FAULT =
  "Something went wrong on our side. Try again, or contact the hotel if it continues.";

export function lookupFailureMessage(status: number | undefined): string {
  if (status === undefined) return UNREACHABLE;
  if (NOT_MATCHED_STATUSES.has(status)) return NOT_MATCHED;
  return SERVER_FAULT;
}
