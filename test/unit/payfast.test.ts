import { describe, expect, it } from "vitest";
import {
  parameterString,
  signature,
  validNotification,
} from "../../.vscode/src/domain/payfast";

describe("PayFast signing", () => {
  it("matches the MD5 known value and PHP form encoding", () => {
    expect(signature({ a: "1" })).toBe("3872c9ae3f427af0be0ead09d07ae2cf");
    expect(
      parameterString({
        name_first: " A B!~*'() ",
        empty: "",
        signature: "ignored",
      }),
    ).toBe("name_first=A+B%21%7E%2A%27%28%29");
    expect(parameterString({ a: "1" }, "a b&")).toBe("a=1&passphrase=a+b%26");
  });
  it("validates signed complete notifications against merchant and exact amount", () => {
    const fields = {
      merchant_id: "123",
      m_payment_id: "REF",
      pf_payment_id: "456",
      payment_status: "COMPLETE",
      amount_gross: "10.00",
    };
    const signed = { ...fields, signature: signature(fields, "secret") };
    const expected = { merchantId: "123", total: 10, passphrase: "secret" };
    expect(validNotification(signed, expected)).toBe(true);
    expect(
      validNotification({ ...signed, amount_gross: "10.01" }, expected),
    ).toBe(false);
    expect(
      validNotification(signed, { ...expected, merchantId: "other" }),
    ).toBe(false);
    expect(validNotification(signed, { ...expected, total: 11 })).toBe(false);
  });
});
