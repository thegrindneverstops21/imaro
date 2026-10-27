import { describe, expect, it } from "vitest";
import { nightsBetween, quoteStay, round2, vatPortion } from "../../src/domain/pricing";

describe("pricing", () => {
  it("counts nights between two dates", () => {
    expect(nightsBetween("2026-10-16", "2026-10-18")).toBe(2);
    expect(nightsBetween("2026-10-30", "2026-11-02")).toBe(3);
  });

  it("is not skewed by daylight saving changes", () => {
    expect(nightsBetween("2026-03-28", "2026-03-30")).toBe(2);
    expect(nightsBetween("2026-10-24", "2026-10-26")).toBe(2);
  });

  it("rounds to two decimals", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(326.0869565)).toBe(326.09);
  });

  it("backs 15% VAT out of a VAT-inclusive total (matches the Figma review screen)", () => {
    expect(vatPortion(2500)).toBe(326.09);
  });

  it("quotes nights, total and VAT across rooms", () => {
    expect(quoteStay(1250, 2, 1)).toEqual({ nights: 2, totalPrice: 2500, vatIncluded: 326.09 });
    expect(quoteStay(1250, 2, 2).totalPrice).toBe(5000);
  });
});
