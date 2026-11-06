import { describe, expect, it } from "vitest";
import { paymentPresentation } from "../../client/src/features/booking/paymentPresentation";

describe("payment return presentation", () => {
  it("waits only for an active unpaid hold", () => {
    expect(paymentPresentation({ status: "held", paymentStatus: "unpaid" }).poll).toBe(true);
  });
  it("stops waiting for an expired hold without claiming payment failed", () => {
    const result = paymentPresentation({ status: "expired", paymentStatus: "unpaid" });
    expect(result.poll).toBe(false);
    expect(result.title).toBe("Your room hold has expired.");
    expect(result.body).toContain("contact the hotel");
  });
  it("distinguishes hotel approval from confirmed reservations", () => {
    expect(paymentPresentation({ status: "pending_approval", paymentStatus: "paid" }).title).toBe("Payment received.");
    expect(paymentPresentation({ status: "confirmed", paymentStatus: "paid" }).title).toBe("Your stay is confirmed.");
  });
  it("does not describe a cancelled paid booking as awaiting approval", () => {
    const result = paymentPresentation({ status: "cancelled", paymentStatus: "paid" });
    expect(result.title).toBe("Your reservation is cancelled.");
    expect(result.body).not.toContain("approve");
    expect(result.poll).toBe(false);
  });
  it("recognizes refunds and unknown states without inventing success", () => {
    expect(paymentPresentation({ status: "cancelled", paymentStatus: "refunded" }).body).toContain("refund");
    expect(paymentPresentation({ status: "unexpected", paymentStatus: "unpaid" }).title).toBe("Check your reservation status.");
  });
});
