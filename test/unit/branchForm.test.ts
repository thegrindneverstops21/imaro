import { describe, expect, it } from "vitest";
import {
  afterCreate,
  BLANK_BRANCH,
  fieldType,
  toBranchPayload,
} from "../../client/src/features/admin/branchForm";

const FILLED = {
  ...BLANK_BRANCH,
  slug: "cape-town",
  name: "Imaro Cape Town",
  description: "Harbour-side stay",
  address: "1 Quay Road",
  city: "Cape Town",
  lat: "-33.9",
  lng: "18.4",
  phone: "+27 21 555 0100",
  email: "capetown@example.com",
  starRating: "4",
};

describe("toBranchPayload", () => {
  it("converts numeric fields and keeps the new branch in draft", () => {
    const payload = toBranchPayload(FILLED);
    expect(payload.lat).toBe(-33.9);
    expect(payload.lng).toBe(18.4);
    expect(payload.starRating).toBe(4);
    expect(payload.isPublished).toBe(false);
  });

  it("keeps times in the HH:MM shape the API validates", () => {
    const payload = toBranchPayload(FILLED);
    expect(payload.checkInTime).toMatch(/^\d{2}:\d{2}$/);
    expect(payload.checkOutTime).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("afterCreate", () => {
  it("clears branch-specific fields and keeps shared ones", () => {
    const next = afterCreate(FILLED);
    expect(next.slug).toBe("");
    expect(next.name).toBe("");
    expect(next.email).toBe("");
    expect(next.phone).toBe(FILLED.phone);
    expect(next.checkInTime).toBe("14:00");
    expect(next.lat).toBe("-33.9");
  });
});

describe("fieldType", () => {
  it("picks the right input type per field", () => {
    expect(fieldType("lat")).toBe("number");
    expect(fieldType("checkInTime")).toBe("time");
    expect(fieldType("email")).toBe("email");
    expect(fieldType("city")).toBe("text");
  });
});
