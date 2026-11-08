import { usePendingChanges } from "../../components/ui/NavigationGuard";
import { SuccessBanner } from "../../components/ui/SuccessBanner";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useFeedback } from "../../components/ui/Feedback";
import { bookingHeaders, message, request } from "../../lib/api";
import type { Booking } from "../../types/api";
import { paymentPresentation } from "./paymentPresentation";
import { bookingToken } from "./bookingAccess";

export function PaymentReturnPage({ cancelled = false }: { cancelled?: boolean }) {
  const [params] = useSearchParams();
  const reference = params.get("reference") ?? "";
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const { notify } = useFeedback();
  const toasted = useRef(false);

  useEffect(() => {
    if (!booking || toasted.current) return;
    const presentation = paymentPresentation(booking);
    if (presentation.poll) return;
    toasted.current = true;
    const settled =
      booking.status === "confirmed" ||
      booking.status === "completed" ||
      (booking.status === "pending_approval" && booking.paymentStatus === "paid");
    notify(settled ? "success" : "warning", presentation.title);
  }, [booking, notify]);
  useEffect(() => {
    toasted.current = false;
    setBooking(null);
    setError("");
    if (!reference) return;
    const controller = new AbortController();
    let timer: number | undefined;
    async function refresh() {
      try {
        const data = await request<Booking>(`/bookings/${encodeURIComponent(reference)}`, {
          headers: bookingHeaders(bookingToken(reference)),
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setBooking(data);
        setError("");
        if (!cancelled && paymentPresentation(data).poll) timer = window.setTimeout(() => void refresh(), 5000);
      } catch (cause) {
        if (!controller.signal.aborted) setError(message(cause));
      }
    }
    void refresh();
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [reference, cancelled, retry]);

  const result = booking ? paymentPresentation(booking) : null;
  usePendingChanges(Boolean(reference) && (!booking || paymentPresentation(booking).poll), {
    title: "Leave payment verification?",
    message: "Payment has not been verified here yet. Leaving does not cancel or refund a payment. Check this reservation through Manage booking before attempting payment again.",
    confirmLabel: "Leave verification", cancelLabel: "Keep checking",
  });
  const cancelledHold = cancelled && result?.poll;
  const title = !reference ? "Find your reservation." : error ? "Payment status unavailable." : cancelledHold ? "You left payment." : result?.title ?? "Checking your reservation.";
  const body = !reference ? "Enter your booking details to check your reservation and payment status." : error ? "We could not verify the latest status. Please check again before attempting another payment." : cancelledHold ? "Your room hold is still recorded as unpaid. If you completed payment, check again before retrying. Leaving PayFast does not cancel your reservation." : result?.body ?? "Retrieving the hotel’s latest reservation and payment records.";

  return <section className="page-shell narrow guest-checkout payment-status-page">
    <h1>{title}</h1>
    {!error && booking && (booking.status === "confirmed" || booking.status === "completed" || (booking.status === "pending_approval" && booking.paymentStatus === "paid"))
      ? <SuccessBanner>{body}</SuccessBanner>
      : <p role="status">{body}</p>}
    {booking && <p>Reference: <strong>{booking.reference}</strong></p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="payment-status-actions">
      {(error || cancelledHold) && <button className="button" onClick={() => setRetry((value) => value + 1)}>Check status again</button>}
      {cancelledHold && <Link className="text-button" to={`/review/${encodeURIComponent(reference)}`}>Return to payment review</Link>}
      {result && !result.poll && booking?.status !== "expired" && <Link className="button" to={`/confirmation/${encodeURIComponent(reference)}`}>View reservation details</Link>}
      {booking?.status === "expired" && <Link className="button" to="/rooms">Search rooms again</Link>}
      <Link className="text-button" to={reference ? `/booking/${encodeURIComponent(reference)}` : "/manage"}>Manage booking</Link>
    </div>
  </section>;
}
