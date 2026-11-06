import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Icon } from "../../components/Icon";
import type { Booking } from "../../types/api";
import { BookingLoading } from "./BookingLoading";
import { BookingReceipt } from "./BookingReceipt";
import { CopyManageLink } from "./CopyManageLink";
import { ReviewForm } from "./ReviewForm";
import { useManagedBooking, type Lookup } from "./useManagedBooking";

const CANCELLABLE = ["held", "pending_approval", "confirmed"];

type FormProps = {
  initialReference: string;
  loading: boolean;
  failed: boolean;
  onFind: (lookup: Lookup) => Promise<void>;
};

function LookupForm({ initialReference, loading, failed, onFind }: FormProps) {
  const [reference, setReference] = useState(initialReference);
  const [token, setToken] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    void onFind({ reference: reference.trim(), token });
  }

  return (
    <form className="lookup-form print-hidden" onSubmit={submit}>
      <label>
        Booking reference
        <input
          required
          value={reference}
          disabled={loading}
          onChange={(event) => setReference(event.target.value)}
          placeholder="IM…"
        />
      </label>
      <label>
        Private manage token (not needed if you are signed in as the booker or
        booked on this device)
        <input
          type="password"
          value={token}
          disabled={loading}
          onChange={(event) => setToken(event.target.value)}
          autoComplete="off"
        />
      </label>
      <button className="button" disabled={loading}>
        {loading ? "Finding booking…" : failed ? "Try again" : "Find booking"}
      </button>
    </form>
  );
}

type ActionsProps = { booking: Booking; busy: boolean; onCancel: () => void };

function ManageActions({ booking, busy, onCancel }: ActionsProps) {
  const canPay =
    booking.status === "held" && booking.paymentStatus === "unpaid";
  const canCancel = CANCELLABLE.includes(booking.status);
  return (
    <div className="receipt-actions">
      {canPay && (
        <Link
          className="button"
          to={`/review/${encodeURIComponent(booking.reference)}`}
        >
          Continue to payment
        </Link>
      )}
      {canCancel && (
        <button
          className="button button-outline"
          disabled={busy}
          onClick={onCancel}
        >
          {busy ? "Cancelling…" : "Cancel reservation"}
        </button>
      )}
      <button className="text-button" onClick={() => window.print()}>
        Print reservation
      </button>
      <CopyManageLink reference={booking.reference} />
    </div>
  );
}

export function ManagePage() {
  const { reference: routeReference = "" } = useParams();
  const { view, notice, actionError, busy, find, cancel } =
    useManagedBooking(routeReference);

  return (
    <section className="page-shell narrow manage-shell guest-checkout">
      <h1>Manage your stay.</h1>
      <p className="print-hidden">
        Look up your booking with its reference and private manage token.
      </p>
      <LookupForm
        key={routeReference}
        initialReference={routeReference}
        loading={view.phase === "loading"}
        failed={view.phase === "failed"}
        onFind={find}
      />
      {view.phase === "loading" && (
        <BookingLoading
          embedded
          shape="receipt"
          label="Finding your reservation…"
        />
      )}
      {view.phase === "failed" && (
        <p className="form-error" role="alert">
          {view.message}
        </p>
      )}
      {notice && (
        <p className="inline-message" role="status">
          {notice}
        </p>
      )}
      {actionError && (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      )}
      {view.phase === "ready" && (
        <BookingReceipt booking={view.booking}>
          <ManageActions
            booking={view.booking}
            busy={busy}
            onCancel={() => void cancel()}
          />
          <p className="small-note print-hidden">
            Keep your manage token private. It authorizes access to this
            reservation.
          </p>
          <ReviewForm
            key={view.booking.reference}
            booking={view.booking}
            token={view.token}
          />
        </BookingReceipt>
      )}
      {view.phase === "idle" && (
        <p className="small-note print-hidden">
          Signed-in booking owners can look up their reservation without a
          token. Otherwise, use the private token saved when the booking was
          created. If you no longer have access, contact the hotel for help.
        </p>
      )}
      <Link to="/" className="text-button print-hidden">
        <Icon name="arrowLeft" /> Browse more stays
      </Link>
    </section>
  );
}
