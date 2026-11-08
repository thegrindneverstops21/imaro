import { useCallback, useEffect, useRef, useState } from "react";
import { message, request } from "../../lib/api";
import type { AdminRoom, Price, RoomTypeOption } from "./adminTypes";

export type Inventory = {
  rooms: AdminRoom[];
  prices: Price[];
  types: RoomTypeOption[];
};

const EMPTY: Inventory = { rooms: [], prices: [], types: [] };

// The API has no room-type list, so known types are whatever rooms and rates mention.
export function typeOptions(rooms: AdminRoom[], prices: Price[]): RoomTypeOption[] {
  const known = new Map<number, RoomTypeOption>();
  for (const room of rooms)
    known.set(room.roomTypeId, { roomTypeId: room.roomTypeId, name: room.roomType });
  for (const price of prices)
    known.set(price.roomTypeId, { roomTypeId: price.roomTypeId, name: price.name });
  return [...known.values()];
}

export function useBranchInventory(branchId: string) {
  const [inventory, setInventory] = useState<Inventory>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const latest = useRef(0);

  const load = useCallback(async () => {
    if (!branchId) {
      setLoading(false);
      return;
    }
    const id = ++latest.current;
    setLoading(true);
    setLoaded(false);
    setError("");
    try {
      const base = `/admin/branches/${branchId}`;
      const [rooms, prices] = await Promise.all([
        request<AdminRoom[]>(`${base}/rooms`),
        request<Price[]>(`${base}/prices`),
      ]);
      if (id === latest.current) {
        setInventory({ rooms, prices, types: typeOptions(rooms, prices) });
        setLoaded(true);
      }
    } catch (cause) {
      if (id === latest.current) setError(message(cause));
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    setInventory(EMPTY); // a different branch must never show the previous one's rooms
    void load();
    return () => {
      latest.current++;
    };
  }, [load]);

  return { ...inventory, loading, loaded, error, reload: load };
}

export type BranchInventory = ReturnType<typeof useBranchInventory>;