import { expect, it } from "vitest";
import { reservationQuery } from "../../client/src/features/admin/reservationSearch";

it("encodes guest search and requests one extra row to determine the next page", () => {
  const query = new URLSearchParams(reservationQuery({ search: "Ada & Co", status: "held" }, "2", 2));
  expect(query.get("search")).toBe("Ada & Co");
  expect(query.get("branchId")).toBe("2");
  expect(query.get("offset")).toBe("50");
  expect(query.get("limit")).toBe("26");
});
it("omits empty filters so the API can use its defaults", () => {
  const query = new URLSearchParams(reservationQuery({ search: "", status: "" }, "", 0));
  expect(query.has("status")).toBe(false);
  expect(query.has("search")).toBe(false);
  expect(query.has("branchId")).toBe(false);
});
