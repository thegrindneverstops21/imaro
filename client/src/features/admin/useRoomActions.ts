import { useEffect, useState } from "react";
import { json } from "../../lib/api";
import type { AdminRoom } from "./adminTypes";
import type { Writes } from "./useAdminWrites";

export type RoomEdit = { id: number; roomNumber: string; roomTypeId: string };
export type NewRoom = { roomTypeId: string; roomNumber: string };

type Reload = () => Promise<void>;

export function useRoomActions(branchId: string, reload: Reload, writes: Writes) {
  const [edit, setEdit] = useState<RoomEdit | null>(null);
  useEffect(() => {
    setEdit(null);
  }, [branchId]);

  const add = ({ roomTypeId, roomNumber }: NewRoom) =>
    writes.write({
      path: `/admin/branches/${branchId}/rooms`,
      options: json("POST", { roomTypeId: Number(roomTypeId), roomNumber, status: "active" }),
      success: "Room added.",
      refresh: reload,
    });

  const retire = (room: AdminRoom) =>
    writes.write({
      path: `/admin/rooms/${room.id}`,
      options: json("DELETE"),
      success: `Room ${room.roomNumber} moved to maintenance.`,
      refresh: reload,
      confirm: `Set room ${room.roomNumber} to maintenance?`,
    });

  async function saveEdit() {
    if (!edit) return;
    const saved = await writes.write({
      path: `/admin/rooms/${edit.id}`,
      options: json("PATCH", {
        roomNumber: edit.roomNumber,
        roomTypeId: Number(edit.roomTypeId),
      }),
      success: "Changes saved.",
      refresh: reload,
    });
    if (saved) setEdit(null);
  }

  return { edit, setEdit, add, retire, saveEdit };
}