import { describe, expect, it } from "vitest";
import { initialStay, validateStay } from "../../client/src/lib/staySearch";

const today = "2026-11-05";
const valid = { checkIn: "2026-11-06", checkOut: "2026-11-08", guests: 2, rooms: 1 };

describe("guest stay search", () => {
  it("keeps a valid saved stay", () => {
    expect(initialStay(valid, today)).toEqual(valid);
  });
  it("replaces expired dates with tomorrow and the following night", () => {
    expect(initialStay({ ...valid, checkIn: "2026-11-02", checkOut: "2026-11-03" }, today))
      .toEqual({ ...valid, checkOut: "2026-11-07" });
  });
  it("requires checkout after checkin and rejects past dates", () => {
    expect(validateStay({ ...valid, checkOut: valid.checkIn }, today)).toMatch(/after/);
    expect(validateStay({ ...valid, checkIn: "2026-11-04" }, today)).toMatch(/past/);
  });
  it("rejects impossible calendar dates and missing values", () => {
    expect(validateStay({ ...valid, checkIn: "2026-02-30" }, today)).toMatch(/valid/);
    expect(validateStay({ ...valid, checkOut: "" }, today)).toMatch(/valid/);
  });
  it("recovers malformed persisted guest and room counts", () => {
    expect(initialStay({ ...valid, guests: NaN, rooms: 99 }, today))
      .toEqual(valid);
  });
  it("handles month and year boundaries", () => {
    expect(initialStay({ ...valid, checkIn: "", checkOut: "" }, "2026-12-31"))
      .toEqual({ ...valid, checkIn: "2027-01-01", checkOut: "2027-01-02" });
  });
});
