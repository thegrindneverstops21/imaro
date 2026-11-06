import { useCallback, useRef, useState } from "react";
import { message, request } from "../../lib/api";

export type Write = {
  path: string;
  options: RequestInit;
  success: string;
  refresh: () => Promise<void>;
  confirm?: string;
};

// One path for every staff write: confirms destructive actions, blocks double
// submits, reports success or failure, then refreshes whatever the write changed.
export function useAdminWrites() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const writing = useRef(false);

  const clearFeedback = useCallback(() => {
    setError("");
    setNotice("");
  }, []);

  const write = useCallback(
    async ({ path, options, success, refresh, confirm }: Write) => {
      if (writing.current) return false;
      if (confirm && !window.confirm(confirm)) return false;
      writing.current = true;
      setBusy(true);
      clearFeedback();
      try {
        await request(path, options);
        setNotice(success);
        await refresh();
        return true;
      } catch (cause) {
        setError(message(cause));
        return false;
      } finally {
        writing.current = false;
        setBusy(false);
      }
    },
    [clearFeedback],
  );

  return { busy, error, notice, clearFeedback, write };
}

export type Writes = ReturnType<typeof useAdminWrites>;