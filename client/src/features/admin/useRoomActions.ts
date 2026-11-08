import { useEffect, useState } from "react";
import { json } from "../../lib/api";
import type { AdminRoom } from "./adminTypes";
import type { Writes } from "./useAdminWrites";

export type RoomEdit = { id: number; roomNumber: string; roomTypeId: string };
export type NewRoom = { roomTypeId: string; roomNumber: string; status?: "active" | "maintenance" };

type Reload = () => Promise<void>;

export function useRoomActions(branchId: string, reload: Reload, writes: Writes) {
  const [edit, setEdit] = useState<RoomEdit | null>(null);
  useEffect(() => {
    setEdit(null);
  }, [branchId]);

  const add = ({ roomTypeId, roomNumber, status = "active" }: NewRoom) =>
    writes.write({
      path: `/admin/branches/${branchId}/rooms`,
      options: json("POST", { roomTypeId: Number(roomTypeId), roomNumber, status }),
      success: `Room ${roomNumber} added with ${status} status.`,
      confirm: `Add room ${roomNumber} with ${status} status? Active rooms can be allocated when a nightly price is available.`,
      confirmLabel: "Add room",
      refresh: reload,
    });

  const retire = (room: AdminRoom) =>
    writes.write({
      path: `/admin/rooms/${room.id}`,
      options: json("DELETE"),
      success: `Room ${room.roomNumber} moved to maintenance.`,
      refresh: reload,
      confirm: `Set room ${room.roomNumber} to maintenance? It will be unavailable for new allocations.`,
      confirmLabel: "Set maintenance",
      danger: true,
    });

  const reactivate = (room: AdminRoom) =>
    writes.write({
      path: `/admin/rooms/${room.id}`,
      options: json("PATCH", { status: "active" }),
      success: `Room ${room.roomNumber} is back in service.`,
      refresh: reload,
      confirm: `Set room ${room.roomNumber} back to active? It can be allocated to bookings when a nightly rate is available.`,
      confirmLabel: "Set active",
    });

  async function saveEdit() {
    if (!edit) return;
    const saved = await writes.write({
      path: `/admin/rooms/${edit.id}`,
      options: json("PATCH", {
        roomNumber: edit.roomNumber,
        roomTypeId: Number(edit.roomTypeId),
      }),
      success: `Room ${edit.roomNumber} updated.`,
      confirm: `Save the number and room type for room ${edit.roomNumber}? This updates the physical room inventory.`,
      confirmLabel: "Save room",
      refresh: reload,
    });
    if (saved) setEdit(null);
  }

  return { edit, setEdit, add, retire, reactivate, saveEdit };
}