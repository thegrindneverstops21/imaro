import type { ReactNode } from "react";
import { displayBrand, formatDate, formatMoney, balanceLine } from "../../lib/format";
import type { Booking } from "../../types/api";

const LOCALE = "en-ZA";
const formatDateTime = (iso: string) => new Date(iso).toLocaleString(LOCALE);
const readable = (value: string) => value.replaceAll("_", " ");

function Row({ name, value }: { name: string; value: string }) {
  return (
    <div className="summary-row">
      <span>{name}</span>
      <strong>{value}</strong>
    </div>
  );
}



function ReceiptRows({ booking }: { booking: Booking }) {
  const balance = balanceLine(booking.balanceDue);
  return (
    <>
      <Row name="Guest" value={booking.guest.name} />
      <Row
        name="Stay"
        value={`${formatDate(booking.checkIn)} — ${formatDate(booking.checkOut)}`}
      />
      <Row
        name="Party"
        value={`${booking.guests} guests · ${booking.nights} nights`}
      />
      <Row name="Payment" value={readable(booking.paymentStatus)} />
      <div className="summary-total">
        <span>Total · VAT included</span>
        <strong>{formatMoney(booking.totalAmount)}</strong>
      </div>
      <Row name="Amount paid" value={formatMoney(booking.amountPaid)} />
      <Row name={balance.name} value={balance.value} />
    </>
  );
}

function ReceiptNotes({ booking }: { booking: Booking }) {
  const { holdExpiresAt, status, cancellation } = booking;
  return (
    <>
      {holdExpiresAt && status === "held" && (
        <p className="hold-note">
          Room held until {formatDateTime(holdExpiresAt)}.
        </p>
      )}
      {cancellation && (
        <p className="small-note">
          {cancellation.freeCancellation
            ? `Free cancellation until ${formatDateTime(cancellation.deadline)}.`
            : `Cancellation fee: ${formatMoney(cancellation.fee)} · refund: ${formatMoney(cancellation.refund)}.`}
        </p>
      )}
      {booking.balanceDue < 0 && (
        <p className="small-note">
          The hotel’s records show more paid than the total. Contact the hotel
          about the difference.
        </p>
      )}
    </>
  );
}

type Props = { booking: Booking; children?: ReactNode };

export function BookingReceipt({ booking, children }: Props) {
  return (
    <article className="booking-receipt">
      <p className="print-only receipt-brand">Imaro Hotels · Reservation</p>
      <div className="receipt-heading">
        <div>
          <p>Reference: {booking.reference}</p>
          <h2>{displayBrand(booking.branch.name)}</h2>
        </div>
        <span className={`status-tag status-${booking.status}`}>
          {readable(booking.status)}
        </span>
      </div>
      <p>
        {booking.rooms
          .map((room) => `${room.rooms} × ${room.roomType}`)
          .join(" · ")}
      </p>
      <ReceiptRows booking={booking} />
      <ReceiptNotes booking={booking} />
      {children}
    </article>
  );
}
