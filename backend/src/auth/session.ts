import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { env } from "../config/env";
import { MS_PER_SECOND, SESSION_SECONDS } from "../constants/domain";
import type { Session, SessionUser } from "../domain/authTypes";

const HMAC_ALGORITHM = "sha256";
const ENCODING = "base64url";
const SEPARATOR = ".";
const AUTHORIZATION_HEADER = "authorization";
const BEARER_PATTERN = /^Bearer\s+(.+)$/i;

// HMAC-SHA256: only someone who knows SESSION_SECRET can produce this signature.
export const signValue = (value: string): string =>
  createHmac(HMAC_ALGORITHM, env.SESSION_SECRET).update(value).digest(ENCODING);

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// Session expiry is stored as a Unix timestamp in SECONDS (not milliseconds).
export function newSession(user: SessionUser, nowMs: number): Session {
  const expiresAt = Math.floor(nowMs / MS_PER_SECOND) + SESSION_SECONDS;
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: expiresAt,
  };
}

// Produces "<base64 payload>.<signature>" for the cookie.
export function encodeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString(ENCODING);
  return `${payload}${SEPARATOR}${signValue(payload)}`;
}

function parsePayload(payload: string): Session | null {
  try {
    return JSON.parse(
      Buffer.from(payload, ENCODING).toString(),
    ) as Session | null;
  } catch {
    return null;
  }
}

// Returns the session only if the signature matches, the shape is sane and it has not expired.
export function decodeSession(
  token: string,
  nowMs: number = Date.now(),
): Session | null {
  const [payload, signature] = token.split(SEPARATOR);
  if (!payload || !signature || !safeEqual(signValue(payload), signature))
    return null;
  const session = parsePayload(payload);
  if (!session || !Number.isInteger(session.userId)) return null;
  return session.exp > nowMs / MS_PER_SECOND ? session : null;
}

export function readSession(req: Request): Session | null {
  const match = BEARER_PATTERN.exec(req.header(AUTHORIZATION_HEADER) ?? "");
  return match?.[1] ? decodeSession(match[1]) : null;
}
