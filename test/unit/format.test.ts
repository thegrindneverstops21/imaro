import { describe, expect, it } from "vitest";
import { formatDateTime, pluralize } from "../../client/src/lib/format";

describe("pluralize", () => {
  it("uses the singular only for exactly one", () => {
    expect(pluralize(1, "night")).toBe("1 night");
    expect(pluralize(2, "night")).toBe("2 nights");
    expect(pluralize(0, "guest")).toBe("0 guests");
  });
});

describe("formatDateTime", () => {
  it("shows the hotel's local time (SAST, UTC+2) whatever the device time zone", () => {
    const text = formatDateTime("2026-11-06T02:02:00Z");
    expect(text).toContain("2026");
    expect(text).toContain("04:02");
  });

  it("rolls the date forward when UTC is still the previous day in South Africa", () => {
    expect(formatDateTime("2026-11-05T23:30:00Z")).toContain("06");
  });
});
