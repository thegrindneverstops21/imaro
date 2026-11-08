import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { RoomGallery } from "./RoomGallery";
import { displayBrand, formatDate, formatMoney } from "../../lib/format";
import { message, request } from "../../lib/api";
import type { Branch } from "../../types/api";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";

export function RoomDetailsPage() {
  const { slug = "", roomType = "" } = useParams();
  const stay = useSelector((state: RootState) => state.stay);
  const navigate = useNavigate();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  // Re-fetches when the room in the URL or the selected stay changes.
  useEffect(() => {
    const controller = new AbortController();
    setBranch(null);
    setError("");
    const query = new URLSearchParams({
      ...stay,
      guests: String(stay.guests),
      rooms: String(stay.rooms),
    });
    void request<Branch>(`/branches/${slug}?${query}`, { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setBranch(result); })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(message(cause)); });
    return () => controller.abort();
  }, [slug, roomType, stay, retry]);

  const room = branch?.roomTypes?.find((item) => item.slug === roomType);
  if (!branch && !error)
    return (
      <section className="page-shell">
        <div className="loading-state" role="status">
          Loading room details…
        </div>
      </section>
    );
  if (!room || !branch)
    return (
      <section className="page-shell narrow">
        <h1>Room details unavailable</h1>
        <p>{error || "This room is not available for the selected stay."}</p>
        <button className="button" onClick={() => setRetry((value) => value + 1)}>Try again</button>{" "}
        <Link className="button button-outline" to={`/rooms?branch=${slug}`}>
          Search again
        </Link>
      </section>
    );

  const total =
    room.totalPrice ??
    room.pricePerNight * (room.nights ?? 1) * room.roomsNeeded;
  return (
    <section className="page-shell room-detail-shell guest-browse guest-room">
      <div className="breadcrumbs">
        <Link to={`/rooms?branch=${slug}`}>Rooms & suites</Link>
        <span> / </span>
        <span>{displayBrand(branch.name)}</span>
        <span> / </span>
        <span>{room.name}</span>
      </div>
      <div className="room-detail-heading"><h1>{room.name}</h1><p>{room.description}</p></div>
      <div className="room-detail-layout">
          <RoomGallery images={room.images} roomName={room.name} />

        <aside className="stay-summary">
          <h2>{displayBrand(branch.name)}</h2>
          <p>
            {branch.address}, {branch.city}
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
              Per room, per night
            </span>
            <strong>{formatMoney(room.pricePerNight)}</strong>
          </div>
          <p>{room.nights ?? 1} night{room.nights === 1 ? "" : "s"} · {room.roomsNeeded} room{room.roomsNeeded === 1 ? "" : "s"}</p>
          <div className="summary-total">
            <span>Total · VAT included</span>
            <strong>{formatMoney(total)}</strong>
          </div>
          <Link className="text-link" to={`/rooms?branch=${slug}#book`}>Change dates or room</Link>
          <button
            className="button button-wide"
            disabled={!room.canBook}
            onClick={() => navigate(`/stay/${slug}/${roomType}`)}
          >
            {room.canBook ? "Continue to guest details" : "Unavailable"}
            {room.canBook && <Icon name="arrowRight" />}
          </button>
        </aside>
          <div className="room-detail-copy">
            <div className="room-specs">
              <span>{room.sizeM2} m²</span>
              <span>{room.bed}</span>
              <span>Up to {room.capacity} guests</span>
            </div>
            <h2>Included in your stay</h2>
            <ul className="amenity-list">
              {room.amenities.map((amenity) => (
                <li key={amenity.name}>{amenity.name}</li>
              ))}
            </ul>
            {branch.policies?.length ? <div className="room-policies">
              <h2>Before you book</h2>
              <div className="policy-list">{branch.policies.map((policy) => <details key={`${policy.type}-${policy.title}`}><summary>{policy.title}<Icon name="plus" /></summary><p>{displayBrand(policy.body)}</p></details>)}</div>
            </div> : null}
          </div>
      </div>
    </section>
  );
}
