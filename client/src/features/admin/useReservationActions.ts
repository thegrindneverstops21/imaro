import { useEffect, useState } from "react";
import { json } from "../../lib/api";
import type { Writes } from "./useAdminWrites";

export type DatesEdit = { reference: string; checkIn: string; checkOut: string };

type Reload = () => Promise<void>;

export function useReservationActions(branchId: string, reload: Reload, writes: Writes) {
  const [edit, setEdit] = useState<DatesEdit | null>(null);
  useEffect(() => {
    setEdit(null);
  }, [branchId]);

  const post = (reference: string, action: "approve" | "cancel") =>
    writes.write({
      path: `/admin/bookings/${encodeURIComponent(reference)}/${action}`,
      options: json("POST"),
      success: `Reservation ${reference} ${action === "approve" ? "approved" : "cancelled"}.`,
      refresh: reload,
      confirm: action === "cancel"
        ? `Cancel reservation ${reference}? Assigned rooms will be released and the cancellation terms will apply. Recorded refund amounts do not mean money has been returned by the payment provider.`
        : `Approve reservation ${reference}? The guest’s stay will be confirmed.`,
      confirmLabel: action === "cancel" ? "Cancel reservation" : "Approve reservation",
      danger: action === "cancel",
    });

  async function saveDates() {
    if (!edit) return;
    const { reference, checkIn, checkOut } = edit;
    const saved = await writes.write({
      path: `/admin/bookings/${encodeURIComponent(reference)}`,
      options: json("PATCH", { checkIn, checkOut }),
      success: `Reservation ${reference} dates updated.`,
      refresh: reload,
      confirm: `Change dates for reservation ${reference} to ${checkIn} → ${checkOut}?`,
      confirmLabel: "Save new dates",
    });
    if (saved) setEdit(null);
  }

  return {
    edit,
    setEdit,
    saveDates,
    approve: (reference: string) => void post(reference, "approve"),
    cancel: (reference: string) => void post(reference, "cancel"),
  };
}