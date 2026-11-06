import { describe, expect, it } from "vitest";
import {
  cancellationOutcome,
  freeCancellationDeadline,
} from "../../.vscode/src/domain/cancellation";

const CHECK_IN = "2026-11-10";
// Free window ends 14:00 SAST (12:00 UTC) two days before check-in.
const DEADLINE = "2026-11-08T12:00:00.000Z";
const base = { checkIn: CHECK_IN, firstNightCharge: 1250, amountPaid: 2500 };

describe("freeCancellationDeadline", () => {
  it("is 14:00 SAST two days before check-in", () => {
    expect(freeCancellationDeadline(CHECK_IN).toISOString()).toBe(DEADLINE);
  });
});

describe("cancellationOutcome", () => {
  it("is free and fully refunded before the deadline", () => {
    const outcome = cancellationOutcome({
      ...base,
      now: new Date("2026-11-01T09:00:00Z"),
    });
    expect(outcome).toEqual({
      freeCancellation: true,
      deadline: DEADLINE,
      fee: 0,
      refund: 2500,
    });
  });

  it("is still free exactly at the deadline", () => {
    const outcome = cancellationOutcome({ ...base, now: new Date(DEADLINE) });
    expect(outcome.freeCancellation).toBe(true);
  });

  it("charges the first night one second after the deadline", () => {
    const outcome = cancellationOutcome({
      ...base,
      now: new Date("2026-11-08T12:00:01Z"),
    });
    expect(outcome).toMatchObject({
      freeCancellation: false,
      fee: 1250,
      refund: 1250,
    });
  });

  it("refunds nothing when the first night is the whole payment", () => {
    const outcome = cancellationOutcome({
      ...base,
      amountPaid: 1250,
      now: new Date("2026-11-09T10:00:00Z"),
    });
    expect(outcome.refund).toBe(0);
  });

  it("never refunds an unpaid booking", () => {
    const free = cancellationOutcome({
      ...base,
      amountPaid: 0,
      now: new Date("2026-11-01T09:00:00Z"),
    });
    expect(free.refund).toBe(0);
  });
});
