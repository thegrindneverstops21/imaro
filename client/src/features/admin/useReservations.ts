import { useCallback, useEffect, useRef, useState } from "react";
import { message, request } from "../../lib/api";
import type { AdminBooking } from "../../types/api";
import { reservationQuery } from "./reservationSearch";

export type Filters = { search: string; status: string };
export const NO_FILTERS: Filters = { search: "", status: "" };
export const PAGE_SIZE = 25;

export function useReservations(branchId: string) {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [pageFor, setPageFor] = useState({ branchId, page: 0 });
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latest = useRef(0);
  // Changing branch starts again at page 1 without a second fetch.
  const page = pageFor.branchId === branchId ? pageFor.page : 0;

  const load = useCallback(async () => {
    const id = ++latest.current;
    setLoading(true);
    setBookings([]);
    setError("");
    try {
      const query = reservationQuery(filters, branchId, page);
      const data = await request<AdminBooking[]>(`/admin/bookings?${query}`);
      if (id === latest.current) setBookings(data);
    } catch (cause) {
      if (id === latest.current) setError(message(cause));
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, [filters, branchId, page]);

  useEffect(() => {
    void load();
    return () => {
      latest.current++;
    };
  }, [load]);

  return {
    bookings,
    loading,
    error,
    page,
    hasNext: bookings.length > PAGE_SIZE,
    reload: load,
    goToPage: (next: number) => setPageFor({ branchId, page: next }),
    applyFilters: (next: Filters) => {
      setFilters(next);
      setPageFor({ branchId, page: 0 });
    },
  };
}