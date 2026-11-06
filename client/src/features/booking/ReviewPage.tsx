import { BookingLoading } from "./BookingLoading";
import { BookingProgress } from "./BookingProgress";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { bookingHeaders, message, request } from "../../lib/api";
import { redirectToPayfast } from "./payfast";
import { displayBrand, formatDate, formatDateTime, formatMoney, pluralize } from "../../lib/format";
import { paymentPresentation } from "./paymentPresentation";
import type { Booking } from "../../types/api";

export function ReviewPage() {
  const { reference = "" } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);
  const [retry, setRetry] = useState(0);
  const token = localStorage.getItem(`imaro.booking.${reference}`) ?? "";

  useEffect(() => {
    const controller = new AbortController();
    setBooking(null);
    setError("");
    void request<Booking>(`/bookings/${encodeURIComponent(reference)}`, {
      headers: bookingHeaders(token), signal: controller.signal,
    }).then((data) => { if (!controller.signal.aborted) setBooking(data); })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(message(cause)); });
    return () => controller.abort();
  }, [reference, token, retry]);

  async function pay() {
    if (submitting.current || !booking || booking.status !== "held" || booking.paymentStatus !== "unpaid") return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const latest = await request<Booking>(`/bookings/${encodeURIComponent(reference)}`, { headers: bookingHeaders(token) });
      setBooking(latest);
      if (latest.status !== "held" || latest.paymentStatus !== "unpaid") {
        throw new Error("Your reservation status has changed. Review the latest details below.");
      }
      if (latest.totalAmount !== booking.totalAmount || latest.balanceDue !== booking.balanceDue) {
        throw new Error("Your amount has changed. Review the updated total and balance before continuing to PayFast.");
      }
      await redirectToPayfast(reference, token);
    } catch (cause) {
      setError(message(cause));
      submitting.current = false;
      setBusy(false);
    }
  }

  if (!booking && !error)
    return <BookingLoading />;
  if (!booking)
    return (
      <section className="page-shell narrow">
        <h1>We could not load your review</h1>
        <p role="alert">{error}</p>
        <button className="button" onClick={() => setRetry((value) => value + 1)}>Try again</button>
        <Link className="button" to="/manage">
          Manage booking
        </Link>
      </section>
    );
  return (
    <section className="page-shell checkout-shell guest-checkout">
      <div className="breadcrumbs">
        <Link to="/rooms">Rooms & suites</Link>
        <span> / </span>
        <span>Review & payment</span>
      </div>
      <BookingProgress current={2} />
      <div className="checkout-layout">
        <div className="checkout-form">
          <h1>Review your stay.</h1>
          <p>Check your stay and the amount due before continuing to PayFast.</p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="review-panel">
            <h2>{displayBrand(booking.branch.name)}</h2>
            <p>
              {booking.rooms
                .map((room) => `${room.rooms} × ${room.roomType}`)
                .join(" · ")}
            </p>
            <div className="summary-row">
              <span>Guest</span>
              <strong>{booking.guest.name}</strong>
            </div>
            <div className="summary-row">
              <span>Email</span>
              <strong>{booking.guest.email}</strong>
            </div>
            <div className="summary-row">
              <span>Stay</span>
              <strong>
                {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
              </strong>
            </div>
            <div className="summary-row">
              <span>Party</span>
              <strong>
                {pluralize(booking.guests, "guest")} · {pluralize(booking.nights, "night")}
              </strong>
            </div>
            <div className="summary-total">
              <span>Total · VAT included</span>
              <strong>{formatMoney(booking.totalAmount)}</strong>
            </div>
          </div>
          <div className="payment-choice">
            <h3>Pay with PayFast</h3>
            <p className="payment-explainer">
              You will be redirected to PayFast to complete payment. Your
              reservation will await hotel approval after payment is verified.
            </p>
          </div>
          <button
            className="button button-wide"
            disabled={busy || booking.status !== "held" || booking.paymentStatus !== "unpaid"}
            onClick={() => void pay()}
          >
            {busy ? "Opening PayFast…" : "Continue to PayFast"}
            {!busy && <Icon name="arrowRight" />}
          </button>
          {booking.status !== "held" && <p role="status">{paymentPresentation(booking).title} <Link to={`/booking/${encodeURIComponent(reference)}`}>View booking details</Link></p>}
          <Link className="text-button" to="/rooms">
            Back to rooms
          </Link>
        </div>
        <aside className="stay-summary">
          <details className="checkout-summary" open>
          <summary>Payment summary · {formatMoney(booking.balanceDue)} due</summary>
          <p>Booking reference</p>
          <h2>{booking.reference}</h2>
          {booking.status === "held" && <p>
            Held until{" "}
            {booking.holdExpiresAt
              ? formatDateTime(booking.holdExpiresAt)
              : "the hold expires"}
            .
          </p>}
          <div className="summary-total">
            <span>Balance due</span>
            <strong>{formatMoney(booking.balanceDue)}</strong>
          </div>
          <div className="summary-row">
            <span>Amount paid</span>
            <strong>{formatMoney(booking.amountPaid)}</strong>
          </div>
          <p className="small-note">
            Prices include VAT. Cancellation terms are set by the property.
          </p>
          </details>
        </aside>
      </div>
    </section>
  );
}
