import { randomBytes } from "node:crypto";
import {
  OAUTH_STATE_BYTES,
  OAUTH_STATE_LIFETIME_MS,
} from "../constants/domain";
import { safeEqual, signValue } from "./session";

const SEPARATOR = ".";
const TOKEN_ENCODING = "base64url";

// A signed, short-lived value that proves the sign-in callback answers a request we started.
export function createOAuthState(nowMs: number = Date.now()): string {
  const payload = `${nowMs}${SEPARATOR}${randomBytes(OAUTH_STATE_BYTES).toString(TOKEN_ENCODING)}`;
  return `${payload}${SEPARATOR}${signValue(payload)}`;
}

// Rejects anything we did not sign, plus expired values (Math.abs covers the clock being slightly behind).
export function isValidOAuthState(
  state: string,
  nowMs: number = Date.now(),
): boolean {
  const split = state.lastIndexOf(SEPARATOR);
  if (split < 0) return false;
  const payload = state.slice(0, split);
  if (!safeEqual(signValue(payload), state.slice(split + 1))) return false;
  const issuedAt = Number(payload.split(SEPARATOR)[0]);
  return (
    Number.isFinite(issuedAt) &&
    Math.abs(nowMs - issuedAt) <= OAUTH_STATE_LIFETIME_MS
  );
}
