import { useFeedback } from "../../components/ui/Feedback";
import { usePendingChanges } from "../../components/ui/NavigationGuard";
import { SuccessBanner } from "../../components/ui/SuccessBanner";
import { Form } from "../../components/ui/Form";
import { useState, type FormEvent } from "react";
import { bookingHeaders, json, message, request } from "../../lib/api";
import type { Booking } from "../../types/api";

export function ReviewForm({ booking, token }: { booking: Booking; token: string }) {
  const { confirm } = useFeedback();
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  usePendingChanges(!saved && Boolean(comment || rating !== "5"));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg" }).format(new Date());
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!(await confirm({ title: "Publish your review?", message: "Your first name, rating and review will be public. Please check that your review contains no private contact details.", confirmLabel: "Publish review", cancelLabel: "Keep editing" }))) return;
    setBusy(true); setError("");
    try {
      await request(`/bookings/${encodeURIComponent(booking.reference)}/review`, { ...json("POST", { rating: Number(rating), comment }), headers: bookingHeaders(token) });
      setSaved(true);
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }
  if (!["confirmed", "completed"].includes(booking.status) || booking.checkOut >= today) return null;
  if (saved) return <SuccessBanner>Thank you. Your review has been published.</SuccessBanner>;
  return <Form className="lookup-form panel" onSubmit={(event) => void submit(event)}>
    <h2>How was your stay?</h2>
    <label>Rating<select value={rating} onChange={(event) => setRating(event.target.value)}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} out of 5</option>)}</select></label>
    <label>Your review<textarea value={comment} maxLength={1000} onChange={(event) => setComment(event.target.value)} /></label>
    <p className="small-note">Your first name and review will be public. Please leave out personal contact details.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button" disabled={busy}>{busy ? "Publishing…" : "Publish review"}</button>
  </Form>;
}
