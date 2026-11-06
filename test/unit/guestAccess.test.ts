import { describe, expect, it } from "vitest";
import { safePath, signInLink } from "../../client/src/lib/authIntent";
import {
  bookingToken,
  rememberBookingToken,
} from "../../client/src/features/booking/bookingAccess";
import { holdState } from "../../client/src/features/booking/holdExpiry";

describe("sign-in return path", () => {
  it("keeps same-site paths and their query", () => {
    expect(safePath("/rooms?branch=polokwane")).toBe("/rooms?branch=polokwane");
  });

  it("rejects external, protocol-relative and empty targets", () => {
    expect(safePath("https://evil.example")).toBe("");
    expect(safePath("//evil.example")).toBe("");
    expect(safePath("")).toBe("");
    expect(safePath(null)).toBe("");
  });

  it("never returns to the sign-in page itself", () => {
    expect(safePath("/login?next=/rooms")).toBe("");
    expect(safePath("/auth/callback")).toBe("");
  });

  it("builds a sign-in link back to the current page, or home", () => {
    expect(signInLink("/rooms?branch=polokwane")).toBe(
      "/login?next=%2Frooms%3Fbranch%3Dpolokwane",
    );
    expect(signInLink("")).toBe("/login?next=%2F");
  });
});

describe("booking hold expiry", () => {
  const now = Date.parse("2026-11-06T10:00:00Z");

  it("reports active, expiring and expired holds", () => {
    expect(holdState("2026-11-06T10:15:00Z", now)).toBe("active");
    expect(holdState("2026-11-06T10:03:00Z", now)).toBe("expiring");
    expect(holdState("2026-11-06T09:59:00Z", now)).toBe("expired");
  });

  it("treats a missing or unreadable deadline as unknown", () => {
    expect(holdState(null, now)).toBe("none");
    expect(holdState("not-a-date", now)).toBe("none");
  });
});

describe("booking access when storage is unavailable", () => {
  it("keeps the token in memory for this tab", () => {
    expect(rememberBookingToken("IMTESTMEMORY", "private-token")).toBe(false);
    expect(bookingToken("IMTESTMEMORY")).toBe("private-token");
  });
});
