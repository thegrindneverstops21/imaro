import { describe, expect, it } from "vitest";
import { StayMessage } from "../../src/constants/messages";
import { isRealIsoDate, validateStayDates } from "../../src/domain/rules";

const TODAY = "2026-10-26";

describe("validateStayDates", () => {
  it("accepts no dates at all", () => {
    expect(validateStayDates({}, TODAY)).toEqual([]);
  });

  it("accepts a valid stay, including check-in today", () => {
    expect(
      validateStayDates({ checkIn: TODAY, checkOut: "2026-10-28" }, TODAY),
    ).toEqual([]);
  });

  it("requires both dates when one is given", () => {
    expect(validateStayDates({ checkIn: TODAY }, TODAY)).toEqual([
      { field: "checkOut", message: StayMessage.BothDatesRequired },
    ]);
    expect(validateStayDates({ checkOut: TODAY }, TODAY)[0]?.field).toBe(
      "checkIn",
    );
  });

  it("rejects a check-in in the past", () => {
    const issues = validateStayDates(
      { checkIn: "2026-10-25", checkOut: "2026-10-27" },
      TODAY,
    );
    expect(issues).toEqual([
      { field: "checkIn", message: StayMessage.CheckInPast },
    ]);
  });

  it("rejects check-out on or before check-in", () => {
    const same = validateStayDates(
      { checkIn: "2026-11-01", checkOut: "2026-11-01" },
      TODAY,
    );
    const before = validateStayDates(
      { checkIn: "2026-11-05", checkOut: "2026-11-01" },
      TODAY,
    );
    expect(same[0]?.message).toBe(StayMessage.CheckOutOrder);
    expect(before[0]?.message).toBe(StayMessage.CheckOutOrder);
  });

  it("rejects stays longer than the maximum", () => {
    const issues = validateStayDates(
      { checkIn: "2026-11-01", checkOut: "2026-12-05" },
      TODAY,
    );
    expect(issues).toEqual([
      { field: "checkOut", message: StayMessage.MaxNights },
    ]);
  });

  it("reports every problem at once", () => {
    const issues = validateStayDates(
      { checkIn: "2026-10-01", checkOut: "2026-09-01" },
      TODAY,
    );
    expect(issues.map((issue) => issue.field)).toEqual(["checkIn", "checkOut"]);
  });
});

describe("isRealIsoDate", () => {
  it("accepts real calendar dates", () => {
    expect(isRealIsoDate("2028-02-29")).toBe(true);
  });

  it("rejects impossible dates", () => {
    expect(isRealIsoDate("2026-02-31")).toBe(false);
    expect(isRealIsoDate("2026-13-01")).toBe(false);
    expect(isRealIsoDate("2027-02-29")).toBe(false);
  });
});
