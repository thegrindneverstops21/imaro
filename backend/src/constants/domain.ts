export const API_PREFIX = "/api/v1";
export const DEFAULT_PORT = 4000;
export const DEFAULT_CLIENT_URL = "http://localhost:5173";
export const JSON_BODY_LIMIT = "1mb";

// Handy time conversions so code below can say `SESSION_DAYS * SECONDS_PER_DAY`.
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;
export const SECONDS_PER_DAY = 86_400;
export const ISO_DATE_LENGTH = 10;
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_NIGHTS = 30;

// Money math. Percent is 15% VAT (South Africa); MONEY_PRECISION is the number of cents in one rand, used to avoid floating-point rounding errors.
export const VAT_PERCENT = 15;
export const PERCENT_BASE = 100;
export const MONEY_PRECISION = 100;

export const GUEST_LIMITS = { min: 1, max: 10 } as const;
export const ROOM_LIMITS = { min: 1, max: 5 } as const;
export const GUEST_FIELD_LIMITS = {
  nameMax: 150,
  emailMax: 254,
  phoneMin: 5,
  phoneMax: 40,
  notesMax: 2000,
} as const;
export const ADDRESS_FIELD_LIMITS = {
  lineMax: 200,
  cityMax: 120,
  provinceMax: 120,
  postalCodeMax: 20,
  countryMax: 80,
} as const;
// Local accounts pick their own password; these limits are enforced by the API, not just the form.
export const PASSWORD_LIMITS = { min: 8, max: 200 } as const;
export const PASSWORD_RESET_TOKEN_BYTES = 32;
export const PASSWORD_RESET_TOKEN_LIMITS = { min: 32, max: 200 } as const;
export const PASSWORD_RESET_LIFETIME_MS = MS_PER_HOUR;
export const ADMIN_LIST_LIMIT = 100;
export const ADMIN_FIELD_LIMITS = {
  slugMax: 100,
  nameMax: 160,
  addressMax: 300,
  cityMax: 120,
  phoneMin: 5,
  phoneMax: 40,
  emailMax: 254,
  latitude: 90,
  longitude: 180,
  roomNumberMax: 40,
  priceMax: 1_000_000,
  starRatingMin: 1,
  starRatingMax: 5,
} as const;
export const CURRENCY = "ZAR";

// Values below are plain objects instead of TypeScript `enum`s: they work the same way but are safer and easier to read for beginners.
export const Environment = {
  Development: "development",
  Test: "test",
  Production: "production",
} as const;

export const RoomStatus = {
  Active: "active",
  Maintenance: "maintenance",
} as const;

export const BookingStatus = {
  Held: "held",
  PendingApproval: "pending_approval",
  Confirmed: "confirmed",
  Cancelled: "cancelled",
  Completed: "completed",
  Expired: "expired",
} as const;

export const CANCELLABLE_STATUSES: readonly string[] = [
  BookingStatus.Held,
  BookingStatus.PendingApproval,
  BookingStatus.Confirmed,
];

export const PaymentStatus = {
  Unpaid: "unpaid",
  Paid: "paid",
  Refunded: "refunded",
} as const;

export const PaymentProvider = { Simulated: "simulated" } as const;
export const PaymentRecordStatus = {
  Complete: "complete",
  Refunded: "refunded",
} as const;
export const UserRole = { Guest: "guest", Admin: "admin" } as const;

// Booking rules
export const HOLD_MINUTES = 15;
export const FREE_CANCELLATION_DAYS = 2;
export const CANCELLATION_DEADLINE_HOUR = 14; // hotel local time
export const HOTEL_UTC_OFFSET_HOURS = 2; // SAST

// Secrets, sessions and sign-in
export const BOOKING_REFERENCE_PREFIX = "IM";
export const REFERENCE_RANDOM_BYTES = 5;
export const ACCESS_TOKEN_BYTES = 32;
export const BOOKING_TOKEN_HEADER = "x-booking-token";
export const SESSION_DAYS = 7;
export const SESSION_SECONDS = SESSION_DAYS * SECONDS_PER_DAY;
export const MIN_SESSION_SECRET_LENGTH = 32;
export const OAUTH_STATE_BYTES = 18;
export const OAUTH_STATE_LIFETIME_MINUTES = 10;
export const OAUTH_STATE_LIFETIME_MS =
  OAUTH_STATE_LIFETIME_MINUTES * MS_PER_MINUTE;
export const LOGIN_SUCCESS_PATH = "/auth/callback";
export const LOGIN_FAILURE_PATH = "/login";

// Error codes that Postgres sends back. Repositories check these to turn a database error into a friendly 409 Conflict response.
export const PG_UNIQUE_VIOLATION = "23505";
export const PG_FOREIGN_KEY_VIOLATION = "23503";

export const PG_EXCLUSION_VIOLATION = "23P01";

// Postgres daterange bounds: check-in night included, check-out day excluded
export const DATE_RANGE_BOUNDS = "[)";

export const SqlFile = { Schema: "schema.sql", Seed: "seed.sql" } as const;
export const SEED_ONLY_ARG = "seed";

export const ExitCode = { Success: 0, Failure: 1 } as const;
