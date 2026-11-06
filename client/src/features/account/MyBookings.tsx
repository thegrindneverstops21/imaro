import { Link } from "react-router-dom";
import {
  balanceLine,
  displayBrand,
  formatDate,
  formatMoney,
  pluralize,
} from "../../lib/format";
import type { Booking } from "../../types/api";
import { AccountState } from "./AccountState";
import { groupBookings, todayInJohannesburg } from "./bookingGroups";
import { useAccountData } from "./useAccountData";

function BookingCard({ booking }: { booking: Booking }) {
  const balance = balanceLine(booking.balanceDue);
  return (
    <article className="panel">
      <div className="booking-card-heading">
        <h3>{displayBrand(booking.branch.name)}</h3>
        <span className={`status-tag status-${booking.status}`}>
          {booking.status.replaceAll("_", " ")}
        </span>
      </div>
      <p>
        {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)} ·{" "}
        {pluralize(booking.nights, "night")}
      </p>
      <p>Reference {booking.reference}</p>
      <p>
        Paid {formatMoney(booking.amountPaid)} · {balance.name} {balance.value}
      </p>
      <Link to={`/booking/${encodeURIComponent(booking.reference)}`}>
        Manage this stay
      </Link>
    </article>
  );
}

type SectionProps = { id: string; title: string; bookings: Booking[] };

function BookingSection({ id, title, bookings }: SectionProps) {
  if (!bookings.length) return null;
  return (
    <section className="account-section" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      <div className="account-list">
        {bookings.map((booking) => (
          <BookingCard key={booking.reference} booking={booking} />
        ))}
      </div>
    </section>
  );
}

function BookingSections({ bookings }: { bookings: Booking[] }) {
  const { upcoming, past } = groupBookings(bookings, todayInJohannesburg());
  return (
    <>
      <BookingSection
        id="upcoming-stays"
        title="Upcoming stays"
        bookings={upcoming}
      />
      <BookingSection
        id="past-stays"
        title="Past and closed bookings"
        bookings={past}
      />
    </>
  );
}

export function MyBookings() {
  const { data, error, reload } = useAccountData<Booking[]>("/me/bookings");
  return (
    <AccountState
      data={data}
      error={error}
      loadingLabel="Loading your bookings…"
      empty={
        <p>
          No bookings on this account yet.{" "}
          <Link to="/rooms">Find your next stay</Link>.
        </p>
      }
      onRetry={reload}
    >
      {(bookings) => <BookingSections bookings={bookings} />}
    </AccountState>
  );
}
