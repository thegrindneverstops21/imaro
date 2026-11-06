import { describe, expect, it } from "vitest";
import {
  amountPaid,
  canAccessBooking,
  canCancel,
  firstNightCharge,
  holdExpiresAt,
  paymentStatusAfterCancel,
} from "../../src/domain/bookingRules";

const TODAY = "2026-10-27";
const live = { status: "confirmed", checkIn: "2026-11-10" };

describe("canCancel", () => {
  it.each(["held", "pending_approval", "confirmed"])(
    "allows %s bookings for a future stay",
    (status) => {
      expect(canCancel({ ...live, status }, TODAY)).toBe(true);
    },
  );

  it.each(["cancelled", "completed", "expired"])(
    "refuses %s bookings",
    (status) => {
      expect(canCancel({ ...live, status }, TODAY)).toBe(false);
    },
  );

  it("refuses once the stay has started or starts today", () => {
    expect(canCancel({ ...live, checkIn: TODAY }, TODAY)).toBe(false);
    expect(canCancel({ ...live, checkIn: "2026-10-20" }, TODAY)).toBe(false);
  });
});

describe("canAccessBooking", () => {
  it("allows the manage token", () => {
    expect(canAccessBooking(7, { token: "x", userId: null }, true)).toBe(true);
  });

  it("allows the signed-in owner only", () => {
    expect(canAccessBooking(7, { token: undefined, userId: 7 }, false)).toBe(
      true,
    );
    expect(canAccessBooking(7, { token: undefined, userId: 8 }, false)).toBe(
      false,
    );
  });

  it("refuses anonymous visitors, even for guest bookings with no owner", () => {
    expect(
      canAccessBooking(null, { token: undefined, userId: null }, false),
    ).toBe(false);
  });
});

describe("money helpers", () => {
  it("counts only paid bookings as paid", () => {
    expect(amountPaid({ paymentStatus: "paid", totalAmount: 2500 })).toBe(2500);
    expect(amountPaid({ paymentStatus: "unpaid", totalAmount: 2500 })).toBe(0);
  });

  it("sums the first night across rooms", () => {
    const rooms = [{ roomType: "Classic Room", rooms: 2, pricePerNight: 1250 }];
    expect(firstNightCharge(rooms)).toBe(2500);
  });

  it("marks refunded only when money actually goes back", () => {
    const outcome = {
      freeCancellation: true,
      deadline: "",
      fee: 0,
      refund: 100,
    };
    expect(paymentStatusAfterCancel({ paymentStatus: "paid" }, outcome)).toBe(
      "refunded",
    );
    expect(
      paymentStatusAfterCancel(
        { paymentStatus: "paid" },
        { ...outcome, refund: 0 },
      ),
    ).toBe("paid");
    expect(paymentStatusAfterCancel({ paymentStatus: "unpaid" }, outcome)).toBe(
      "unpaid",
    );
  });
});

describe("holdExpiresAt", () => {
  it("is 15 minutes after now", () => {
    const now = new Date("2026-10-27T10:00:00Z");
    expect(holdExpiresAt(now).toISOString()).toBe("2026-10-27T10:15:00.000Z");
  });
});
