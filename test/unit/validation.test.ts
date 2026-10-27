import { describe, expect, it } from "vitest";
import { availabilityQuery, branchSearchQuery, stayQuery } from "../../src/validation/stay";
import { daysFromToday } from "../helpers";

describe("query validation", () => {
  it("applies defaults for guests and rooms", () => {
    expect(stayQuery.parse({})).toEqual({ guests: 1, rooms: 1 });
  });

  it("coerces query strings to numbers", () => {
    const parsed = branchSearchQuery.parse({ guests: "3", maxPrice: "1500" });
    expect(parsed).toMatchObject({ guests: 3, maxPrice: 1500 });
  });

  it("rejects out-of-range guests and rooms", () => {
    expect(stayQuery.safeParse({ guests: "0" }).success).toBe(false);
    expect(stayQuery.safeParse({ guests: "11" }).success).toBe(false);
    expect(stayQuery.safeParse({ rooms: "6" }).success).toBe(false);
  });

  it("rejects malformed and impossible dates", () => {
    expect(stayQuery.safeParse({ checkIn: "10/11/2026", checkOut: "2026-11-12" }).success).toBe(false);
    expect(stayQuery.safeParse({ checkIn: "2027-02-31", checkOut: "2027-03-02" }).success).toBe(false);
  });

  it("requires dates for availability", () => {
    expect(availabilityQuery.safeParse({}).success).toBe(false);
  });

  it("accepts a valid future stay", () => {
    const query = { checkIn: daysFromToday(10), checkOut: daysFromToday(12) };
    expect(availabilityQuery.safeParse(query).success).toBe(true);
  });
});
