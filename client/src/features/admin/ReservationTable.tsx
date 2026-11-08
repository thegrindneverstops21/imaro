import { Chip } from "../../components/ui";
import { balanceLine, displayBrand, formatDate, formatMoney, pluralize } from "../../lib/format";
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

type RowProps = { booking: AdminBooking; actions: RowActions };

type ChipColor = "default" | "primary" | "secondary" | "success" | "warning" | "danger";

function statusColor(status: string): ChipColor {
  if (/cancel|expir|fail|reject/i.test(status)) return "danger";
  if (/pending|held|review/i.test(status)) return "warning";
  if (/confirm|paid|complet|approv/i.test(status)) return "success";
  return "default";
}

function StatusCell({ booking }: { booking: AdminBooking }) {
  return (
    <td>
      <Chip size="sm" variant="flat" color={statusColor(booking.status)}>
        {readable(booking.status)}
      </Chip>
      <Chip size="sm" variant="bordered" color={statusColor(booking.paymentStatus)}>
        {readable(booking.paymentStatus)}
      </Chip>
    </td>
  );
}

function AmountCell({ booking }: { booking: AdminBooking }) {
  const balance = balanceLine(booking.balanceDue);
  return (
    <td>
      {formatMoney(booking.totalAmount)}
      <small>Paid: {formatMoney(booking.amountPaid)}</small>
      <small>
        {balance.name}: {balance.value}
      </small>
    </td>
  );
}

function ActionCell({ booking, actions }: RowProps) {
  const { reference, status } = booking;
  const open = !CLOSED_BOOKING_STATUSES.includes(status);
  const modifiable = MODIFIABLE_BOOKING_STATUSES.includes(status);
  return (
    <td className="table-actions">
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
          Cancel
        </button>
      )}
    </td>
  );
}

function ReservationRow({ booking, actions }: RowProps) {
  return (
    <tr>
      <td>
        <strong>{booking.guestName}</strong>
        <small>
          {booking.reference} · {booking.guestEmail}
        </small>
      </td>
      <td>{displayBrand(booking.branchName)}</td>
      <td>
        {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
        <small>{pluralize(booking.guests, "guest")}</small>
      </td>
      <StatusCell booking={booking} />
      <AmountCell booking={booking} />
      <ActionCell booking={booking} actions={actions} />
    </tr>
  );
}

type TableProps = { bookings: AdminBooking[]; actions: RowActions };

export function ReservationTable({ bookings, actions }: TableProps) {
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label="Scrollable reservations table">
      <table>
        <thead>
          <tr>
            <th>Guest / reference</th>
            <th>Property</th>
            <th>Stay</th>
            <th>Status</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.slice(0, PAGE_SIZE).map((booking) => (
            <ReservationRow key={booking.reference} booking={booking} actions={actions} />
          ))}
        </tbody>
      </table>
    </div>
  );
}