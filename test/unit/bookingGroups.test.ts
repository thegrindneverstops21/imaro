import { describe, expect, it } from "vitest";
import { groupBookings } from "../../client/src/features/account/bookingGroups";
import type { Booking } from "../../client/src/types/api";

const make = (
  reference: string,
  checkIn: string,
  checkOut: string,
  status = "confirmed",
) => ({ reference, checkIn, checkOut, status }) as Booking;

const TODAY = "2026-11-10";

describe("groupBookings", () => {
  it("lists upcoming stays soonest first", () => {
    const result = groupBookings(
      [
        make("B", "2026-12-20", "2026-12-22"),
        make("A", "2026-11-15", "2026-11-17"),
      ],
      TODAY,
    );
    expect(result.upcoming.map((b) => b.reference)).toEqual(["A", "B"]);
  });

  it("lists past stays newest first", () => {
    const result = groupBookings(
      [
        make("OLD", "2026-01-01", "2026-01-03"),
        make("NEW", "2026-09-01", "2026-09-03"),
      ],
      TODAY,
    );
    expect(result.past.map((b) => b.reference)).toEqual(["NEW", "OLD"]);
  });

  it("treats a stay that ends today as upcoming", () => {
    const result = groupBookings([make("X", "2026-11-08", TODAY)], TODAY);
    expect(result.upcoming).toHaveLength(1);
  });

  it("moves cancelled and expired bookings to past even when the dates are ahead", () => {
    const result = groupBookings(
      [
        make("C", "2026-12-01", "2026-12-03", "cancelled"),
        make("E", "2026-12-05", "2026-12-06", "expired"),
      ],
      TODAY,
    );
    expect(result.upcoming).toHaveLength(0);
    expect(result.past).toHaveLength(2);
  });
});
