export function reservationQuery(
  filters: { search: string; status: string },
  branchId: string,
  page: number,
) {
  const query = new URLSearchParams({ limit: "26", offset: String(page * 25) });
  if (filters.search.trim()) query.set("search", filters.search.trim());
  if (filters.status) query.set("status", filters.status);
  if (branchId) query.set("branchId", branchId);
  return query.toString();
}
