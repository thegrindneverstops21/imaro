import { describe, expect, it } from "vitest";
import { lookupFailureMessage } from "../../client/src/features/booking/lookupRecovery";

describe("lookupFailureMessage", () => {
  it("treats auth failures and unknown references the same way", () => {
    for (const status of [401, 403, 404]) {
      expect(lookupFailureMessage(status)).toMatch(/reference and token/i);
    }
  });

  it("blames the connection when the request never got a response", () => {
    expect(lookupFailureMessage(undefined)).toMatch(/connection/i);
  });

  it("falls back to a server-side message", () => {
    expect(lookupFailureMessage(500)).toMatch(/our side/i);
  });
});
