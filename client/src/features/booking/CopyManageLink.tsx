import { useFeedback } from "../../components/ui/Feedback";
import { useState } from "react";

type CopyState = "idle" | "copied" | "failed";

const MESSAGES: Record<Exclude<CopyState, "idle">, string> = {
  copied: "Manage link copied. Your private token is not included.",
  failed:
    "The link could not be copied. Copy it from your browser’s address bar.",
};

export function CopyManageLink({ reference }: { reference: string }) {
  const { notify } = useFeedback();
  const [state, setState] = useState<CopyState>("idle");

  async function copy() {
    const path = `/booking/${encodeURIComponent(reference)}`;
    try {
      await navigator.clipboard.writeText(
        new URL(path, window.location.origin).href,
      );
      setState("copied");
      notify("success", MESSAGES.copied);
    } catch {
      setState("failed");
    }
  }

  return (
    <>
      <button type="button" className="text-button" onClick={() => void copy()}>
        Copy manage link
      </button>
      {state !== "idle" && (
        <span className="small-note" role={state === "failed" ? "alert" : undefined}>
          {MESSAGES[state]}
        </span>
      )}
    </>
  );
}
