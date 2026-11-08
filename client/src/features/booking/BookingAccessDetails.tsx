import { useFeedback } from "../../components/ui/Feedback";
import { useState } from "react";

type CopyState = "" | "copied" | "failed";

const COPIED =
  "Private access details copied. Store them somewhere only you can reach.";
const FAILED =
  "We couldn’t copy the details. Show the token and write it down before you leave this page.";

export function BookingAccessDetails({
  reference,
  token,
}: {
  reference: string;
  token: string;
}) {
  const { notify } = useFeedback();
  const [visible, setVisible] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("");

  if (!token) return null;

  async function copyDetails() {
    const manageUrl = new URL(
      `/booking/${encodeURIComponent(reference)}`,
      window.location.origin,
    ).href;
    const details = [
      "Imaro reservation",
      `Reference: ${reference}`,
      `Private manage token: ${token}`,
      `Manage: ${manageUrl}`,
      "Anyone with this token can view and cancel the reservation. Keep it private.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(details);
      setCopyState("copied");
      notify("success", COPIED);
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <section
      className="booking-access print-hidden"
      aria-labelledby="booking-access-title"
    >
      <h2 id="booking-access-title">Keep access to this booking</h2>
      <p>
        Your private manage token opens this reservation on another device.
        Anyone with it can view and cancel the booking, so share it only with
        people you trust.
      </p>
      <div className="booking-access-code">
        <span>
          Reference <strong>{reference}</strong>
        </span>
        <span>
          Private token{" "}
          <code>{visible ? token : "•".repeat(24)}</code>
        </span>
      </div>
      <div className="receipt-actions">
        <button
          type="button"
          className="button button-outline"
          onClick={() => setVisible(!visible)}
        >
          {visible ? "Hide token" : "Show token"}
        </button>
        <button
          type="button"
          className="text-button"
          onClick={() => void copyDetails()}
        >
          Copy private access details
        </button>
      </div>
      {copyState && (
        <p className="small-note" role={copyState === "failed" ? "alert" : undefined}>
          {copyState === "copied" ? COPIED : FAILED}
        </p>
      )}
    </section>
  );
}
