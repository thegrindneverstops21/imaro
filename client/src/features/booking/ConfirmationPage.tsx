import { Link, useParams } from "react-router-dom";
import { Icon } from "../../components/Icon";
import type { Booking } from "../../types/api";
import { BookingAccessDetails } from "./BookingAccessDetails";
import { BookingLoading } from "./BookingLoading";
import { BookingProgress } from "./BookingProgress";
import { BookingReceipt } from "./BookingReceipt";
import { bookingTokenPersisted } from "./bookingAccess";
import { paymentPresentation } from "./paymentPresentation";
import { useManagedBooking } from "./useManagedBooking";

const CONFIRMATION_STEP = 3;

const HELD_COPY = {
  title: "Your room is held.",
  body: "Your room hold is awaiting payment. Open your booking to review the latest details.",
};

const UNSAVED_TOKEN =
  "This browser could not save your private manage token. Copy your access details below before you close this page.";

const outcomeCopy = (booking: Booking) =>
  booking.status === "held" ? HELD_COPY : paymentPresentation(booking);

function ConfirmationView({
  booking,
  token,
}: {
  booking: Booking;
  token: string;
}) {
  const outcome = outcomeCopy(booking);
  const tokenUnsaved = Boolean(token) && !bookingTokenPersisted(booking.reference);
  return (
    <section className="page-shell narrow confirmation-shell guest-checkout">
      <BookingProgress current={CONFIRMATION_STEP} />
      <h1>{outcome.title}</h1>
      <p className="confirmation-lead">{outcome.body}</p>
      <BookingReceipt booking={booking}>
        <div className="receipt-actions">
          <button
            className="button button-outline"
            onClick={() => window.print()}
          >
            Print reservation
          </button>
          <Link
            className="button"
            to={`/booking/${encodeURIComponent(booking.reference)}`}
          >
            Manage booking
          </Link>
        </div>
        {tokenUnsaved && (
          <p className="form-error print-hidden" role="alert">
            {UNSAVED_TOKEN}
          </p>
        )}
        <p className="small-note">
          Keep your reference and private manage token safe. Payment and
          reservation status above reflect the hotel’s current records.
        </p>
        {token && (
          <BookingAccessDetails reference={booking.reference} token={token} />
        )}
      </BookingReceipt>
      <Link to="/" className="text-button print-hidden">
        <Icon name="arrowLeft" /> Browse more stays
      </Link>
    </section>
  );
}

type FailedProps = { message: string; onRetry: () => void };

function ConfirmationFailed({ message, onRetry }: FailedProps) {
  return (
    <section className="page-shell narrow guest-checkout">
      <h1>Confirmation unavailable</h1>
      <p role="alert">{message}</p>
      <div className="receipt-actions">
        <button className="button" onClick={onRetry}>
          Try again
        </button>
        <Link className="button button-outline" to="/manage">
          Manage booking
        </Link>
      </div>
    </section>
  );
}

export function ConfirmationPage() {
  const { reference = "" } = useParams();
  const { view, find } = useManagedBooking(reference);

  if (view.phase === "ready")
    return <ConfirmationView booking={view.booking} token={view.token} />;
  if (view.phase === "failed")
    return (
      <ConfirmationFailed
        message={view.message}
        onRetry={() => void find({ reference, token: "" })}
      />
    );
  return <BookingLoading shape="receipt" />;
}
