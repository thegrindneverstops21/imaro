import { BookingLoading } from "./BookingLoading";
import { BookingProgress } from "./BookingProgress";
import { Icon } from "../../components/Icon";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { displayBrand, formatDate, formatMoney } from "../../lib/format";
import { json, request, message } from "../../lib/api";
import type { Branch, CreatedBooking } from "../../types/api";
import { clearGuestDraft, setGuestDraft, type RootState } from "../../app/store";

export function BookingPage() {
  const { slug = "", roomType = "" } = useParams();
  const stay = useSelector((state: RootState) => state.stay);
  const navigate = useNavigate();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const form = useSelector((state: RootState) => state.guestDraft);
  const dispatch = useDispatch();
  const setForm = (draft: typeof form) => dispatch(setGuestDraft(draft));
  const submitting = useRef(false);
  const [terms, setTerms] = useState(false);

  // useMemo keeps the same URL string between renders, so the effect below does not re-run and re-fetch on every keystroke in the form.
  const detailUrl = useMemo(() => {
    const query = new URLSearchParams({
      ...stay,
      guests: String(stay.guests),
      rooms: String(stay.rooms),
    });
    return `/branches/${slug}?${query}`;
  }, [slug, stay]);

  // `active` guards against setting state after the page is gone (a common React warning when a user navigates away mid-request).
  useEffect(() => {
    let active = true;
    setLoading(true);
    setBranch(null);
    setError("");
    setTerms(false);
    void request<Branch>(detailUrl)
      .then((data) => {
        if (active) setBranch(data);
      })
      .catch((cause: unknown) => {
        if (active) setError(message(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [detailUrl]);

  const room = branch?.roomTypes?.find((item) => item.slug === roomType);
  const total = room
    ? (room.totalPrice ??
      room.pricePerNight * (room.nights ?? 1) * room.roomsNeeded)
    : 0;

  // Creating the booking does NOT pay for it: the server places a 15-minute hold.
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !room?.canBook || !terms) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const created = await request<CreatedBooking>(
        "/bookings",
        json("POST", {
          branchSlug: slug,
          roomType,
          ...stay,
          ...form,
        }),
      );
      localStorage.setItem(
        `imaro.booking.${created.reference}`,
        created.manageToken,
      );
      dispatch(clearGuestDraft());
      navigate(`/review/${created.reference}`);
    } catch (cause) {
      setError(message(cause));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (loading)
    return <BookingLoading />;
  if (!branch || !room)
    return (
      <section className="page-shell narrow">
        <h1>Room details unavailable</h1>
        <p>{error || "This room can’t be booked for the selected dates."}</p>
        <Link className="button" to="/">
          Search again
        </Link>
      </section>
    );

  return (
    <section className="page-shell checkout-shell guest-checkout">
      <div className="breadcrumbs">
        <Link to="/rooms">Rooms & suites</Link>
        <span> / </span>
        <span>{displayBrand(branch.name)}</span>
        <span> / </span>
        <span>{room.name}</span>
      </div>
      <BookingProgress current={1} />
      <div className="checkout-layout">
        <form
          className="checkout-form"
          onSubmit={(event) => void submit(event)}
        >
          <h1>Guest details</h1>
          <p>
            We’ll hold these rooms for 15 minutes while you complete the next
            step.
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-grid">
            <label className="span-two">
              Full name
              <input
                autoComplete="name"
                required
                maxLength={150}
                value={form.guestName}
                onChange={(e) =>
                  setForm({ ...form, guestName: e.target.value })
                }
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={form.guestEmail}
                onChange={(e) =>
                  setForm({ ...form, guestEmail: e.target.value })
                }
              />
            </label>
            <label>
              Mobile number
              <input
                type="tel"
                autoComplete="tel"
                required
                minLength={5}
                maxLength={40}
                placeholder="+27"
                value={form.guestPhone}
                onChange={(e) =>
                  setForm({ ...form, guestPhone: e.target.value })
                }
              />
            </label>
            <label className="span-two">
              Special requests <small>Optional</small>
              <textarea
                rows={4}
                maxLength={2000}
                value={form.specialRequests}
                onChange={(e) =>
                  setForm({ ...form, specialRequests: e.target.value })
                }
                placeholder="Let the hotel know about anything that would make your stay more comfortable."
              />
            </label>
          </div>
          {branch.policies?.length ? (
            <section
              className="checkout-policies"
              aria-labelledby="checkout-policies-title"
            >
              <h2 id="checkout-policies-title">Before you continue</h2>
              {branch.policies.map((policy) => (
                <details key={`${policy.type}-${policy.title}`} open>
                  <summary>{policy.title}</summary>
                  <p>{displayBrand(policy.body)}</p>
                </details>
              ))}
            </section>
          ) : null}
          <label className="terms-choice">
            <input
              type="checkbox"
              required
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
            />
            <span>
              I understand this booking uses a temporary room hold and agree to{" "}
              <a href="#checkout-policies-title">the hotel’s cancellation policy</a>.
            </span>
          </label>
          {!room.canBook && <p className="form-error" role="alert">This room is no longer available for your stay. Change room or dates to continue.</p>}
          <p className="checkout-final-total">Stay total · VAT included <strong>{formatMoney(total)}</strong></p>
          <button className="button button-wide" disabled={busy || !room.canBook}>
            {busy ? "Creating your room hold…" : "Continue to review & payment"}
            {!busy && <Icon name="arrowRight" />}
          </button>
        </form>
        <aside className="stay-summary" aria-label="Stay summary">
          <details className="checkout-summary" open>
          <summary>Your stay · {formatMoney(total)}</summary>
          <h2>{displayBrand(branch.name)}</h2>
          <p>
            {branch.address}, {branch.city}
          </p>
          <div
            className="summary-room-image"
            style={{
              backgroundImage: room.images[0]?.url
                ? `url("${room.images[0].url}")`
                : undefined,
            }}
            role="img"
            aria-label={room.images[0]?.alt ?? room.name}
          />
          <h3>{room.name}</h3>
          <p>
            {room.bed} · {room.sizeM2} m²
          </p>
          <div className="summary-row">
            <span>Check in</span>
            <strong>{formatDate(stay.checkIn)}</strong>
          </div>
          <div className="summary-row">
            <span>Check out</span>
            <strong>{formatDate(stay.checkOut)}</strong>
          </div>
          <div className="summary-row">
            <span>Guests · rooms</span>
            <strong>
              {stay.guests} · {room.roomsNeeded}
            </strong>
          </div>
          <div className="summary-row">
            <span>
              {room.nights ?? 1} {(room.nights ?? 1) === 1 ? "night" : "nights"} × {formatMoney(room.pricePerNight)} ×{" "}
              {room.roomsNeeded}
            </span>
            <strong>{formatMoney(total)}</strong>
          </div>
          <div className="summary-total">
            <span>Total · VAT included</span>
            <strong>{formatMoney(total)}</strong>
          </div>
          <Link className="text-button" to={`/room/${slug}/${roomType}`}>Change room or dates</Link>
          </details>
        </aside>
      </div>
    </section>
  );
}
