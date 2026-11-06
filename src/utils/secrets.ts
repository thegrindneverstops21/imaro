import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import {
  ACCESS_TOKEN_BYTES,
  BOOKING_REFERENCE_PREFIX,
  REFERENCE_RANDOM_BYTES,
} from "../constants/domain";

const HASH_ALGORITHM = "sha256";
const HEX = "hex";
const TOKEN_ENCODING = "base64url";

export function newBookingReference(): string {
  const random = randomBytes(REFERENCE_RANDOM_BYTES)
    .toString(HEX)
    .toUpperCase();
  return `${BOOKING_REFERENCE_PREFIX}-${random}`;
}

export const newAccessToken = (): string =>
  randomBytes(ACCESS_TOKEN_BYTES).toString(TOKEN_ENCODING);

export const hashToken = (token: string): string =>
  createHash(HASH_ALGORITHM).update(token).digest(HEX);

// Constant-time comparison so response timing never leaks how much of a token matched.
export function tokenMatchesHash(
  token: string | undefined,
  storedHash: string,
): boolean {
  if (!token) return false;
  const given = Buffer.from(hashToken(token));
  const stored = Buffer.from(storedHash);
  return given.length === stored.length && timingSafeEqual(given, stored);
}
