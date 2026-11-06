import { afterEach, expect, it, vi } from "vitest";
import { env } from "../../backend/src/config/env";
import { verifyWithPayfast } from "../../backend/src/services/payfastGateway";

afterEach(() => vi.unstubAllGlobals());

it("posts the received ordered fields to sandbox validation and requires VALID", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, text: async () => "VALID\n" });
  vi.stubGlobal("fetch", fetch);
  const previous = env.PAYFAST_SANDBOX;
  env.PAYFAST_SANDBOX = true;
  try {
    expect(
      await verifyWithPayfast({
        m_payment_id: "A B",
        empty: "",
        signature: "ignored",
      }),
    ).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://sandbox.payfast.co.za/eng/query/validate",
      expect.objectContaining({
        method: "POST",
        body: "m_payment_id=A+B&empty=",
        redirect: "error",
        signal: expect.any(AbortSignal),
      }),
    );
    fetch.mockResolvedValue({ ok: true, text: async () => "INVALID" });
    expect(await verifyWithPayfast({})).toBe(false);
  } finally {
    env.PAYFAST_SANDBOX = previous;
  }
});
