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
      success: `Reservation ${reference} updated.`,
      refresh: reload,
      ...(action === "cancel" && { confirm: `Cancel reservation ${reference}?` }),
    });

  async function saveDates() {
    if (!edit) return;
    const { reference, checkIn, checkOut } = edit;
    const saved = await writes.write({
      path: `/admin/bookings/${encodeURIComponent(reference)}`,
      options: json("PATCH", { checkIn, checkOut }),
      success: "Changes saved.",
      refresh: reload,
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