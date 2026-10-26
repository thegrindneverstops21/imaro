export const API_PREFIX = "/api/v1";
export const DEFAULT_PORT = 4000;
export const DEFAULT_CLIENT_URL = "http://localhost:5173";
export const JSON_BODY_LIMIT = "1mb";

export const MS_PER_DAY = 86_400_000;
export const ISO_DATE_LENGTH = 10;
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_NIGHTS = 30;

export const VAT_PERCENT = 15;
export const PERCENT_BASE = 100;
export const MONEY_PRECISION = 100;

export const GUEST_LIMITS = { min: 1, max: 10 } as const;
export const ROOM_LIMITS = { min: 1, max: 5 } as const;

export const Environment = {
  Development: "development",
  Test: "test",
  Production: "production",
} as const;

export const RoomStatus = {
  Active: "active",
  Maintenance: "maintenance",
} as const;

// Postgres daterange bounds: check-in night included, check-out day excluded
export const DATE_RANGE_BOUNDS = "[)";

export const SqlFile = { Schema: "schema.sql", Seed: "seed.sql" } as const;
export const SEED_ONLY_ARG = "seed";

export const ExitCode = { Success: 0, Failure: 1 } as const;
