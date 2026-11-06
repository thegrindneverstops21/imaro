export type HoldState = "active" | "expiring" | "expired" | "none";

const EXPIRING_WINDOW_MS = 5 * 60_000;

export function holdState(
  holdExpiresAt: string | null,
  now = Date.now(),
): HoldState {
  if (!holdExpiresAt) return "none";
  const end = Date.parse(holdExpiresAt);
  if (!Number.isFinite(end)) return "none";
  if (end <= now) return "expired";
  return end - now <= EXPIRING_WINDOW_MS ? "expiring" : "active";
}
