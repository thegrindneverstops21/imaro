import { useCallback, useRef, useState } from "react";
import { message, request } from "../../lib/api";
import { useFeedback } from "../../components/ui/Feedback";

export type Write = {
  path: string;
  options: RequestInit;
  success: string;
  refresh: () => Promise<void>;
  confirm: string;
  confirmLabel: string;
  danger?: boolean;
};

// One path for every staff write: confirms destructive actions, blocks double
// submits, reports success or failure, then refreshes whatever the write changed.
export function useAdminWrites() {
  const { notify, confirm: askConfirm } = useFeedback();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const writing = useRef(false);

  const clearFeedback = useCallback(() => {
    setError("");
    setNotice("");
  }, []);

  const write = useCallback(
    async ({ path, options, success, refresh, confirm, confirmLabel, danger }: Write) => {
      if (writing.current) return false;
      writing.current = true;
      if (!(await askConfirm({
        title: `${confirmLabel}?`,
        message: confirm,
        confirmLabel,
        cancelLabel: "Go back",
        danger: danger === true,
      }))) { writing.current = false; return false; }
      setBusy(true);
      clearFeedback();
      try {
        await request(path, options);
        setNotice(success);
        notify("success", success);
        try {
          await refresh();
        } catch (cause) {
          setError("Saved successfully, but the list could not refresh. Refresh it before making another change.");
          notify("warning", "Saved, but refresh failed", message(cause));
        }
        return true;
      } catch (cause) {
        const text = message(cause);
        setError(text);
        notify("error", "Something went wrong", text);
        return false;
      } finally {
        writing.current = false;
        setBusy(false);
      }
    },
    [clearFeedback, askConfirm, notify],
  );

  return { busy, error, notice, clearFeedback, write };
}

export type Writes = ReturnType<typeof useAdminWrites>;