import type { Request } from "express";
import { describe, expect, it } from "vitest";
import { createOAuthState, isValidOAuthState } from "../../backend/src/auth/oauthState";
import {
  decodeSession,
  encodeSession,
  newSession,
  readSession,
  signValue,
} from "../../backend/src/auth/session";

const NOW = Date.parse("2026-10-27T10:00:00Z");
const user = { id: 5, email: "a@test.example", name: "A", role: "guest" };
const requestWith = (authorization?: string) =>
  ({ header: () => authorization }) as unknown as Request;

describe("session tokens", () => {
  it("round-trips a valid session", () => {
    const token = encodeSession(newSession(user, NOW));
    expect(decodeSession(token, NOW)).toMatchObject({
      userId: 5,
      email: "a@test.example",
      role: "guest",
    });
  });

  it("rejects a tampered payload", () => {
    const [, signature] = encodeSession(newSession(user, NOW)).split(".");
    const forged = Buffer.from(
      JSON.stringify({ userId: 1, role: "admin", exp: 9_999_999_999 }),
    ).toString("base64url");
    expect(decodeSession(`${forged}.${signature}`, NOW)).toBeNull();
  });

  it("rejects a token signed with the wrong key", () => {
    const payload = Buffer.from(
      JSON.stringify({ userId: 1, role: "admin", exp: 9_999_999_999 }),
    ).toString("base64url");
    expect(decodeSession(`${payload}.not-the-real-signature`, NOW)).toBeNull();
  });

  it("rejects an expired session", () => {
    const token = encodeSession(newSession(user, NOW));
    const eightDaysLater = NOW + 8 * 86_400_000;
    expect(decodeSession(token, eightDaysLater)).toBeNull();
  });

  it.each(["", "garbage", "a.b", "..."])(
    "rejects malformed token %j",
    (token) => {
      expect(decodeSession(token, NOW)).toBeNull();
    },
  );

  it("rejects a signed payload that is not a session", () => {
    const payload = Buffer.from("null").toString("base64url");
    expect(decodeSession(`${payload}.${signValue(payload)}`, NOW)).toBeNull();
  });
});

describe("readSession", () => {
  it("reads a Bearer token from the Authorization header", () => {
    const token = encodeSession(newSession(user, Date.now()));
    expect(readSession(requestWith(`Bearer ${token}`))?.userId).toBe(5);
  });

  it("returns null without a usable header", () => {
    expect(readSession(requestWith())).toBeNull();
    expect(readSession(requestWith("Basic abc"))).toBeNull();
    expect(readSession(requestWith("Bearer nonsense"))).toBeNull();
  });
});

describe("oauth state", () => {
  it("accepts a fresh state", () => {
    expect(isValidOAuthState(createOAuthState(NOW), NOW)).toBe(true);
  });

  it("rejects an expired state", () => {
    const state = createOAuthState(NOW);
    expect(isValidOAuthState(state, NOW + 11 * 60_000)).toBe(false);
  });

  it("rejects a modified or foreign state", () => {
    const state = createOAuthState(NOW);
    expect(isValidOAuthState(`${state}x`, NOW)).toBe(false);
    expect(isValidOAuthState("1.2.3", NOW)).toBe(false);
    expect(isValidOAuthState("nodots", NOW)).toBe(false);
  });
});
