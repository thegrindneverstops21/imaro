import { useCallback, useEffect, useState } from "react";
import { message, request } from "../../lib/api";
import type { Branch } from "../../types/api";

export function useAdminBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const data = await request<Branch[]>("/admin/branches");
      setBranches(data);
      setSelected((current) => current || (data[0]?.id ? String(data[0].id) : ""));
      setError("");
    } catch (cause) {
      setError(message(cause));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { branches, selected, select: setSelected, error, reload };
}