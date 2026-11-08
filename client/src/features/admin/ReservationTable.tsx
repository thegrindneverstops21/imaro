import { Fragment, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "../../components/ui";
import { balanceLine, formatDate, formatMoney, pluralize } from "../../lib/format";
import type { AdminBooking } from "../../types/api";
import {
  CLOSED_BOOKING_STATUSES,
  MODIFIABLE_BOOKING_STATUSES,
  readable,
} from "./adminTypes";
import { PAGE_SIZE } from "./useReservations";

export type RowActions = {
  onApprove: (reference: string) => void;
  onModify: (booking: AdminBooking) => void;
  onCancel: (reference: string) => void;
};

type RowProps = { booking: AdminBooking; actions: RowActions; duplicate?: boolean };

function statusTone(status: string) {
  if (["confirmed", "paid", "completed", "approved"].includes(status)) return "success";
  if (["held", "unpaid", "pending", "pending_approval", "partially_paid"].includes(status)) return "pending";
  if (["failed", "rejected"].includes(status)) return "danger";
  return "neutral";
}

function StatusCell({ booking }: { booking: AdminBooking }) {
  return <td><div className="reservation-statuses">
    {[{ label: "Reservation", value: booking.status }, { label: "Payment", value: booking.paymentStatus }].map(({ label, value }) => (
      <span key={label} className="reservation-status-group">
        <span className="reservation-status-caption">{label}</span>
        <span className={`reservation-badge ${statusTone(value)}`} aria-label={`${label}: ${readable(value)}`}>
          {readable(value).replace(/^./, (letter) => letter.toUpperCase())}
        </span>
      </span>
    ))}
  </div></td>;
}

function ActionCell({ booking, actions }: RowProps) {
  const { reference, status } = booking;
  const open = !CLOSED_BOOKING_STATUSES.includes(status);
  const modifiable = MODIFIABLE_BOOKING_STATUSES.includes(status);
  return (
    <div className="table-actions">
      {status === "pending_approval" && (
        <button aria-label={`Approve ${reference}`} onClick={() => actions.onApprove(reference)}>
          Approve
        </button>
      )}
      {modifiable && (
        <button aria-label={`Modify dates for ${reference}`} onClick={() => actions.onModify(booking)}>
          Modify
        </button>
      )}
      {open && (
        <button aria-label={`Cancel ${reference}`} onClick={() => actions.onCancel(reference)}>
          Cancel reservation
        </button>
      )}
    </div>
  );
}

function ReservationRow({ booking, actions, duplicate }: RowProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Fragment><tr className={`reservation-row${expanded ? " is-expanded" : ""}`}>
      <td>
        <strong>{booking.guestName}</strong>
        <small>
          {booking.reference}
        </small>
        {duplicate && (
          <span className="reservation-badge pending reservation-duplicate-flag">
            Possible duplicate
          </span>
        )}
      </td>
      <td>
        {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
        <small>{pluralize(booking.guests, "guest")}</small>
      </td>
      <StatusCell booking={booking} />
      <td className="reservation-amount">{formatMoney(booking.totalAmount)}</td>
      <td className="reservation-action"><button type="button" className="reservation-details-toggle" aria-label={`${expanded ? "Close" : "View"} details for ${booking.reference}`} aria-haspopup="dialog" onClick={() => setExpanded(true)}>View details</button></td>
    </tr>
    <Modal isOpen={expanded} onOpenChange={setExpanded} size="lg" placement="center" scrollBehavior="inside" classNames={{ base: "admin-modal reservation-modal", backdrop: "reservation-modal-backdrop" }}>
      <ModalContent>
        <ModalHeader><div><h2>Reservation details</h2><p>{booking.reference}</p></div></ModalHeader>
        <ModalBody className="admin-modal-body reservation-modal-body">
          <section className="reservation-modal-section">
            <h3>Guest</h3>
            <div className="reservation-modal-guest"><strong>{booking.guestName}</strong><a href={`mailto:${booking.guestEmail}`}>{booking.guestEmail}</a></div>
          </section>
          <section className="reservation-modal-section">
            <div className="reservation-section-title"><h3>Stay</h3><span className={`reservation-badge ${statusTone(booking.status)}`}>{readable(booking.status).replace(/^./, (letter) => letter.toUpperCase())}</span></div>
            <dl className="reservation-modal-facts">
              <div><dt>Check in</dt><dd>{formatDate(booking.checkIn)}</dd></div>
              <div><dt>Check out</dt><dd>{formatDate(booking.checkOut)}</dd></div>
              <div><dt>Party size</dt><dd>{pluralize(booking.guests, "guest")}</dd></div>
            </dl>
          </section>
          <section className="reservation-modal-section">
            <div className="reservation-section-title"><h3>Payment</h3><span className={`reservation-badge ${statusTone(booking.paymentStatus)}`}>{readable(booking.paymentStatus).replace(/^./, (letter) => letter.toUpperCase())}</span></div>
            <dl className="reservation-payment-lines">
              <div><dt>Reservation total</dt><dd>{formatMoney(booking.totalAmount)}</dd></div>
              <div><dt>Amount paid</dt><dd>{formatMoney(booking.amountPaid)}</dd></div>
              <div className="reservation-payment-balance"><dt>{balanceLine(booking.balanceDue).name}</dt><dd>{balanceLine(booking.balanceDue).value}</dd></div>
            </dl>
          </section>
        </ModalBody>
        <ModalFooter>
          <ActionCell booking={booking} actions={{
            onApprove: (reference) => { setExpanded(false); actions.onApprove(reference); },
            onCancel: (reference) => { setExpanded(false); actions.onCancel(reference); },
            onModify: (reservation) => { setExpanded(false); actions.onModify(reservation); },
          }} />
          <button type="button" className="reservation-modal-close" onClick={() => setExpanded(false)}>Close</button>
        </ModalFooter>
      </ModalContent>
    </Modal>
    </Fragment>
  );
}

type TableProps = { bookings: AdminBooking[]; actions: RowActions };

export function ReservationTable({ bookings, actions }: TableProps) {
  const duplicates = new Map<string, number>();
  for (const booking of bookings) {
    const key = `${booking.guestName.trim().toLowerCase()}|${booking.checkIn}|${booking.checkOut}`;
    duplicates.set(key, (duplicates.get(key) ?? 0) + 1);
  }
  return (
    <div className="table-scroll reservation-table-wrap" tabIndex={0} role="region" aria-label="Scrollable reservations table">
      <table className="reservation-table">
        <thead>
          <tr>
            <th scope="col">Guest / reference</th>
            <th scope="col">Stay</th>
            <th scope="col">Status</th>
            <th scope="col" className="reservation-amount">Total</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.slice(0, PAGE_SIZE).map((booking) => {
            const key = `${booking.guestName.trim().toLowerCase()}|${booking.checkIn}|${booking.checkOut}`;
            return (
              <ReservationRow
                key={booking.reference}
                booking={booking}
                actions={actions}
                duplicate={(duplicates.get(key) ?? 0) > 1}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}