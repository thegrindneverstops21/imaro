import { formatMoney } from "../../lib/format";
import { json } from "../../lib/api";
import type { Price } from "./adminTypes";
import type { Writes } from "./useAdminWrites";

export type RateInput = { roomTypeId: string; pricePerNight: string };

type Reload = () => Promise<void>;

const REMOVE_RATE_WARNING =
  "Remove this room type’s nightly rate? It may no longer be bookable until a rate is restored.";

export function useRateActions(branchId: string, reload: Reload, writes: Writes) {
  const base = `/admin/branches/${branchId}/prices`;

  const save = ({ roomTypeId, pricePerNight }: RateInput) =>
    writes.write({
      path: `${base}/${roomTypeId}`,
      options: json("PUT", { pricePerNight: Number(pricePerNight) }),
      success: `Nightly rate saved at ${formatMoney(Number(pricePerNight))}.`,
      confirm: `Set the nightly rate to ${formatMoney(Number(pricePerNight))}, including VAT? New bookings will use this price.`,
      confirmLabel: "Save nightly rate",
      refresh: reload,
    });

  const remove = (price: Price) =>
    writes.write({
      path: `${base}/${price.roomTypeId}`,
      options: json("DELETE"),
      success: "Rate removed.",
      refresh: reload,
      confirm: REMOVE_RATE_WARNING,
      confirmLabel: "Remove rate",
      danger: true,
    });

  return { save, remove };
}