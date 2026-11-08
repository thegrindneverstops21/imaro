export const fallbackError =
  "Something went wrong on our end. Please try again in a few moments.";

const messages: Record<string, string> = {
  "Validation failed": "Please check the details you entered and try again.",
  "Email or password is incorrect":
    "That email and password do not match. Please try again or reset your password.",
  "Booking not found":
    "We couldn’t find that booking. Please check your reference and private booking key, or sign in to the account used to book.",
  "Booking manage token required in x-booking-token header":
    "Please enter your private booking key or sign in to the account used to book.",
  "Resource already exists":
    "These details are already in use. Please choose a different name, reference or room number.",
  "Referenced resource does not exist or is still in use":
    "That selection is unavailable or still in use. Refresh the page and choose another option.",
  "Room has current or future reservations":
    "This room has upcoming or current bookings. Please resolve those bookings before changing the room.",
  "Guest count exceeds reserved room capacity":
    "There are too many guests for these rooms. Please choose more rooms or fewer guests.",
  "No rooms available for the changed stay":
    "There aren’t enough rooms for those dates. Please choose different dates.",
  "Booking hold has expired or is no longer payable":
    "This reservation is no longer available for payment. Check its latest status or choose your stay again.",
  "Only paid reservations awaiting approval can be approved":
    "Only paid bookings awaiting approval can be approved. Refresh to see the latest status.",
  "Reservation must be paid before approval":
    "Please wait for payment to be received before approving this booking.",
  "Only pending or confirmed reservations can be modified":
    "This booking can no longer be edited. Refresh to see its latest status.",
  "Dates must be valid YYYY-MM-DD values":
    "Please choose valid check-in and check-out dates.",
  "dateTo must be on or after dateFrom":
    "Please choose an end date on or after the start date.",
  "Provide at least one field": "Please enter the details you want to change.",
  "Google sign-in is not configured":
    "Google sign-in is unavailable right now. Please sign in with your email instead.",
  "Google sign-in failed":
    "We couldn’t sign you in with Google. Please try again or use your email.",
  "Google email is not verified":
    "Please verify your email with Google before signing in, or use email sign-in.",
};

const safeMessages = new Set([
  "Choose an image smaller than 5 MB.",
  "Please choose a JPEG, PNG or WebP image.",
  "That email already has an account. Sign in instead, or continue with Google.",
  "This password reset link is invalid or has expired",
  "Invalid or expired sign-in attempt, please try again",
  "Those rooms are no longer available for your dates",
  "This booking can no longer be cancelled",
  "That room type is not available at this branch",
  "Your reservation status has changed. Review the latest details below.",
  "Your amount has changed. Review the updated total and balance before continuing to PayFast.",
]);

export function friendlyError(raw: unknown, status = 0): string {
  if (status === 413)
    return "That file is too large. Please choose an image smaller than 5 MB.";
  if (status >= 500) return fallbackError;
  if (typeof raw === "string") {
    if (messages[raw]) return messages[raw];
    if (safeMessages.has(raw)) return raw;
  }
  if (status === 401) return "Please sign in again to continue.";
  if (status === 403)
    return "Your account doesn’t have access to this action. Please use an authorised account.";
  if (status === 404)
    return "We couldn’t find what you requested. Please refresh or return to the previous page.";
  if (status === 409)
    return "These details have changed or are already in use. Please refresh and review them before trying again.";
  if (status === 429)
    return "There have been too many attempts. Please wait a few moments before trying again.";
  if (status === 400 || status === 422)
    return "Please check the details you entered and try again.";
  return fallbackError;
}
