import { Icon } from "../../components/Icon";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { displayBrand, formatDate, formatMoney, pluralize } from "../../lib/format";
import { request, message, json } from "../../lib/api";
import { localToday, nextDay, validateStay } from "../../lib/staySearch";
import { rememberPendingSave, rememberSignInNext, signInLink, takePendingSave } from "../../lib/authIntent";
import type { Branch, Stay } from "../../types/api";
import {
  setStay,
  toggleFavorite,
  type AppDispatch,
  type RootState,
} from "../../app/store";
import { LOCATION_SAVED, SAVE_LOCATION, SAVED_STAYS } from "../../lib/labels";

const HERO_PHOTO = "imaro.hero-photo";

// The last photograph the API sent for a location, kept so a refresh paints the hero at once instead of a blank band.
function rememberedHeroPhoto(): { slug: string; url: string; alt: string } | null {
  try {
    const saved = JSON.parse(localStorage.getItem(HERO_PHOTO) ?? "null");
    return saved && typeof saved.url === "string" ? saved : null;
  } catch {
    return null;
  }
}

export function BrowsePage({
  favoritesOnly = false,
  roomsPage = false,
  onBookingVisibility,
  onHeroVisibility,
}: {
  favoritesOnly?: boolean;
  roomsPage?: boolean;
  onBookingVisibility?: (visible: boolean) => void;
  onHeroVisibility?: (visible: boolean) => void;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const stay = useSelector((state: RootState) => state.stay);
  const favorites = useSelector((state: RootState) => state.favorites);
  const user = useSelector((state: RootState) => state.user);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const linkedSlug = new URLSearchParams(location.search).get("branch") ?? "";
  const [selectedSlug, setSelectedSlug] = useState(linkedSlug);
  const [cachedPhoto] = useState(rememberedHeroPhoto);
  const [detail, setDetail] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(stay);
  const [validation, setValidation] = useState("");
  const [retry, setRetry] = useState(0);
  const [sort, setSort] = useState("recommended");
  const [saveError, setSaveError] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyStatus, setNotifyStatus] = useState("");
  const [notifyError, setNotifyError] = useState("");
  const [notifyBusy, setNotifyBusy] = useState(false);
  const bookingArea = useRef<HTMLElement>(null);
  const heroArea = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = bookingArea.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      onBookingVisibility?.(entry.boundingClientRect.bottom < 80);
    });
    observer.observe(target);
    return () => { observer.disconnect(); onBookingVisibility?.(false); };
  }, [roomsPage, onBookingVisibility]);

  // The header is drawn over the hero photograph until the hero scrolls past it.
  useEffect(() => {
    const target = heroArea.current;
    if (!target) return;
    const measure = () => onHeroVisibility?.(target.getBoundingClientRect().bottom > 96);
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [roomsPage, onHeroVisibility]);

  // Favourites belong to locations, not individual room categories.
  async function saveStay(slug: string) {
    if (!user) {
      rememberPendingSave(slug);
      const here = `${location.pathname}${location.search}${location.hash}`;
      rememberSignInNext(here);
      navigate(signInLink(here));
      return;
    }

    setSaving(true); setSaveError("");
    try {
      await request(`/me/favourites/${encodeURIComponent(slug)}`, json(favorites.includes(slug) ? "DELETE" : "PUT"));
      dispatch(toggleFavorite(slug));
    } catch (cause) { setSaveError(message(cause)); }
    finally { setSaving(false); }
  }

  async function subscribeToAvailability(slug: string) {
    if (!notifyEmail.trim()) {
      setNotifyError("Enter an email address to receive availability updates.");
      return;
    }
    setNotifyBusy(true);
    setNotifyError("");
    setNotifyStatus("");
    try {
      const result = await request<{ message: string }>(
        `/branches/${encodeURIComponent(slug)}/availability-notifications`,
        json("POST", { email: notifyEmail }),
      );
      setNotifyStatus(result.message);
    } catch (cause) {
      setNotifyError(message(cause));
    } finally {
      setNotifyBusy(false);
    }
  }

  // A save started while signed out resumes once the guest is back and signed in.
  useEffect(() => {
    if (!user) return;
    const savedSlug = takePendingSave();
    if (savedSlug) void saveStay(savedSlug);
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setDetail(null);
    const query = new URLSearchParams({ ...stay, guests: String(stay.guests), rooms: String(stay.rooms) });
    async function search() {
      let data: Branch[];
      try {
        data = await request<Branch[]>(`/branches?${query}`, { signal: controller.signal });
      } catch (cause) {
        if (!controller.signal.aborted) { setError(message(cause)); setLoading(false); }
        return;
      }
      if (controller.signal.aborted) return;
      const visible = favoritesOnly ? data.filter((branch) => favorites.includes(branch.slug)) : data;
      setBranches(visible);
      // A deep-linked property keeps its identity even when it has no availability.
      const requested = selectedSlug || linkedSlug;
      const target = requested || visible[0]?.slug || "";
      if (!target) { setLoading(false); return; }
      try {
        const result = await request<Branch>(`/branches/${encodeURIComponent(target)}?${query}`, { signal: controller.signal });
        if (!controller.signal.aborted) setDetail(result);
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(requested ? "That location isn’t available. Choose one of the current locations below." : message(cause));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void search();
    return () => controller.abort();
  }, [stay, selectedSlug, linkedSlug, favoritesOnly, favorites, retry]);

  function updateStay(patch: Partial<Stay>) {
    setDraft({ ...draft, ...patch });
    setValidation("");
  }
  // The selected property keeps its own name and rooms even without availability.
  const requestedSlug = selectedSlug || linkedSlug;
  const locations = detail && !branches.some((branch) => branch.slug === detail.slug) ? [...branches, detail] : branches;
  const active = detail ?? (requestedSlug ? locations.find((branch) => branch.slug === requestedSlug) : locations[0]);
  const rooms = [...(detail?.roomTypes ?? [])].sort((a, b) =>
    sort === "price" ? a.pricePerNight - b.pricePerNight : sort === "size" ? b.sizeM2 - a.sizeM2 : 0,
  );
  const changed = draft.checkIn !== stay.checkIn || draft.checkOut !== stay.checkOut || draft.guests !== stay.guests || draft.rooms !== stay.rooms;
  // No placeholder photograph: the hero shows a branch image, or the one this location served last time.
  const remembered =
    cachedPhoto && (!linkedSlug || cachedPhoto.slug === linkedSlug) ? cachedPhoto.url : undefined;
  const image = detail?.images?.[0]?.url ?? active?.imageUrl ?? remembered;
  const imageAlt = displayBrand(
    detail?.images?.[0]?.alt || active?.imageAlt || cachedPhoto?.alt || "Imaro Hotel",
  );
  const noteImage = detail?.images?.[1]?.url ?? image;

  useEffect(() => {
    if (!active?.slug || !image) return;
    try {
      localStorage.setItem(HERO_PHOTO, JSON.stringify({ slug: active.slug, url: image, alt: imageAlt }));
    } catch {
      // Storage can be unavailable in private browsing; the hero then loads from the API on each visit.
    }
  }, [active?.slug, image, imageAlt]);

  return (
    <div className="guest-browse">
      {roomsPage ? (
        <div className="rooms-intro page-shell">
          <h1>Rooms & suites</h1>
          <p>Choose your location and dates to compare rooms for your stay.</p>
        </div>
      ) : <section className="hero imaro-hero" ref={heroArea}>
        {image && (
          <div className="hero-image">
            <img key={image} src={image} alt={imageAlt} fetchPriority="high" decoding="async" />
          </div>
        )}
        <div className="hero-copy">
          <h1>
            Stay a<br />little longer.
          </h1>
          <p>
            Discover Imaro. Find your room, choose your dates, and make yourself at home.
          </p>
          <a className="button" href="#book">
            Find your stay <Icon name="arrowDown" />
          </a>
        </div>
        <div className="hero-caption">
          {active ? `Imaro · ${active.city}` : "Imaro Hotel · South Africa"}
        </div>
      </section>}
      <section className="search-wrap" id="book" ref={bookingArea} aria-label="Find a room">
        <form
          className="search-panel booking-bar"
          onSubmit={(event) => {
            event.preventDefault();
            const problem = validateStay(draft);
            setValidation(problem);
            if (problem) return;
            dispatch(setStay(draft));
            setRetry((value) => value + 1);
          }}
        >
          <label>
            Location{" "}
            <select
              value={active?.slug ?? ""}
              onChange={(event) => setSelectedSlug(event.target.value)}
              aria-label="Choose Imaro location"
            >
              {locations.length ? (
                locations.map((branch) => (
                  <option key={branch.slug} value={branch.slug}>
                    {branch.city}
                  </option>
                ))
              ) : (
                <option value="">{loading ? "Loading locations…" : "No locations available"}</option>
              )}
            </select>
          </label>
          <label>
            Check in{" "}
            <input
              type="date"
              value={draft.checkIn}
              min={localToday()}
              onChange={(event) => updateStay({ checkIn: event.target.value })}
              required
            />
          </label>
          <label>
            Check out{" "}
            <input
              type="date"
              min={draft.checkIn ? nextDay(draft.checkIn) : localToday()}
              value={draft.checkOut}
              onChange={(event) => updateStay({ checkOut: event.target.value })}
              required
            />
          </label>
          <label>
            Guests{" "}
            <select
              value={draft.guests}
              onChange={(event) =>
                updateStay({ guests: Number(event.target.value) })
              }
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} guest{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Rooms{" "}
            <select
              value={draft.rooms}
              onChange={(event) =>
                updateStay({ rooms: Number(event.target.value) })
              }
            >
              {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} room{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Checking rooms…" : "Check availability"} <Icon name="arrowRight" />
          </button>
        </form>
        {validation && <p className="form-error" role="alert">{validation}</p>}
        {changed && !validation && <p className="search-hint" role="status">Dates or guests changed. Check availability to update the room prices below.</p>}
      </section>
      <section className="page-shell rooms-section" id="rooms">
        <div className="section-heading">
          <div>
            <h2>
              {favoritesOnly
                ? `Your ${SAVED_STAYS.toLowerCase()}`
                : roomsPage ? (active?.city ?? "Available rooms") : "Rooms to settle into"}
            </h2>
            <p>
              {active ? `${active.city} · ` : ""}
              {formatDate(stay.checkIn)} — {formatDate(stay.checkOut)} ·{" "}
              {pluralize(stay.guests, "guest")} · {pluralize(stay.rooms, "room")}
            </p>
          </div>
          {locations.length > 1 && (
            <div className="location-tabs" aria-label="Imaro locations">
              {locations.map((branch) => (
                <button
                  key={branch.slug}
                  className={branch.slug === active?.slug ? "active" : ""}
                  aria-pressed={branch.slug === active?.slug}
                  onClick={() => setSelectedSlug(branch.slug)}
                >
                  {branch.city}
                </button>
              ))}
            </div>
          )}
        </div>
        {active && !loading && !error && <div className="room-toolbar">
          <button className="text-link" aria-pressed={favorites.includes(active.slug)} disabled={saving} onClick={() => void saveStay(active.slug)}>
            <Icon name="heart" />{favorites.includes(active.slug) ? LOCATION_SAVED : SAVE_LOCATION}
          </button>
          {roomsPage && <label>Sort rooms<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recommended</option><option value="price">Lowest nightly rate</option><option value="size">Largest room</option></select></label>}
        </div>}
        {saveError && <p className="form-error" role="alert">{saveError}</p>}
        {error && (
          <p role="alert" className="form-error">
            {error}{" "}
            <button className="text-button" onClick={() => setRetry((value) => value + 1)}>
              Try again
            </button>
          </p>
        )}
        {loading ? (
          <div className="loading-state" role="status" aria-busy="true">
            <span className="loader" />
            Checking rooms for your stay…
          </div>
        ) : null}
        {!loading && !error && !active && !branches.length && !rooms.length && (
          <div className="empty-state">
            <h3>
              {favoritesOnly
                ? "Nothing saved just yet."
                : stay.checkIn && stay.checkOut
                  ? "No rooms match those dates."
                  : "No Imaro locations are available yet."}
            </h3>
            <p>
              {favoritesOnly
                ? "Save an Imaro location and find it here next time."
                : stay.checkIn && stay.checkOut
                  ? "Try different dates, fewer guests, or another location."
                  : "Please check back soon, or contact us if you need help planning your stay."}
            </p>
            {favoritesOnly && (
              <Link className="button button-outline" to="/">
                Explore Imaro
              </Link>
            )}
            {!favoritesOnly && !stay.checkIn && !stay.checkOut && (
              <Link className="button button-outline" to="/contact">
                Contact us
              </Link>
            )}
          </div>
        )}
        {!loading && !error && active && !rooms.length && (
          <div className="empty-state availability-notice" role="status">
            <h3>{displayBrand(active.name)} is not yet bookable.</h3>
            <p>This published location has no rooms available yet. Check back soon or choose another location.</p>
            <form className="availability-signup" onSubmit={(event) => { event.preventDefault(); void subscribeToAvailability(active.slug); }}>
              <label>
                Notify me when rooms are available
                <input type="email" required value={notifyEmail} onChange={(event) => setNotifyEmail(event.target.value)} placeholder="you@example.com" />
              </label>
              <button className="button button-outline" disabled={notifyBusy}>
                {notifyBusy ? "Saving…" : "Notify me"}
              </button>
            </form>
            {notifyStatus && <p className="inline-message" role="status">{notifyStatus}</p>}
            {notifyError && <p className="form-error" role="alert">{notifyError}</p>}
            {active.phone && <a className="button button-outline" href={`tel:${active.phone.replace(/[^+\d]/g, "")}`}>Call this hotel</a>}
            {active.email && <a className="button button-outline" href={`mailto:${active.email}`}>Email this hotel</a>}
            {branches.some((branch) => branch.slug !== active.slug) && (
              <button
                className="button button-outline"
                onClick={() => setSelectedSlug(branches.find((branch) => branch.slug !== active.slug)?.slug ?? "")}
              >
                See another location
              </button>
            )}
          </div>
        )}
        {!loading && !error && active && rooms.length > 0 && !rooms.some((room) => room.canBook) && (
          <div className="empty-state availability-notice" role="status">
            <h3>No rooms at {displayBrand(active.name)} for these dates.</h3>
            <p>You can still look through the rooms below, change your dates, or choose another location.</p>
            {branches.some((branch) => branch.slug !== active.slug) && (
              <button className="button button-outline" onClick={() => setSelectedSlug(branches.find((branch) => branch.slug !== active.slug)?.slug ?? "")}>
                See another location
              </button>
            )}
          </div>
        )}
        {!loading && !error && active && rooms.length > 0 && (
          <div className="room-grid">
            {(roomsPage ? rooms : rooms.slice(0, 2)).map((room, index) => {
              const photo =
                room.images?.[0]?.url ??
                active?.images?.[index % (active.images?.length || 1)]?.url ??
                active?.imageUrl ??
                "";
              return (
                <article
                  className={`editorial-room room-${index + 1}`}
                  key={room.slug}
                >
                  <div
                    className="editorial-room-photo"
                    style={{
                      backgroundImage: photo ? `url("${photo}")` : undefined,
                    }}
                    role="img"
                    aria-label={room.images?.[0]?.alt ?? room.name}
                  >
                  </div>
                  <div className="editorial-room-copy">
                    <h3>{room.name}</h3>
                    <p className="room-description">{room.description}</p>
                    <div className="room-specs">
                      <span>{room.sizeM2} m²</span>
                      <span>{room.bed}</span>
                      <span>Up to {room.capacity} guests</span>
                    </div>
                    <div className="editorial-room-footer">
                      <div>
                        <strong>{formatMoney(room.pricePerNight)}</strong>
                        <small>per room, per night · VAT included</small>
                        {room.totalPrice != null && (
                          <small>
                            {formatMoney(room.totalPrice)} for{" "}
                            {room.nights ?? 1} night{room.nights === 1 ? "" : "s"} · {room.roomsNeeded} room{room.roomsNeeded === 1 ? "" : "s"}
                          </small>
                        )}
                      </div>
                      <div className="room-card-actions">
                        <button
                          className="text-link"
                          onClick={() =>
                            navigate(`/room/${active.slug}/${room.slug}`)
                          }
                        >
                          View this room <Icon name="arrowUpRight" />
                        </button>
                        {!room.canBook && (
                          <span className="unavailable">
                            Unavailable for this stay
                          </span>
                        )}
                      </div>
                    </div>
                    {room.amenities?.length > 0 && (
                      <p className="room-amenities">
                        {room.amenities
                          .slice(0, 4)
                          .map((amenity) => amenity.name)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {!roomsPage && !loading && !error && rooms.length > 0 && (
          <Link className="button button-outline browse-all" to={`/rooms?branch=${active?.slug ?? ""}`}>
            Explore all rooms <Icon name="arrowRight" />
          </Link>
        )}
          <div className="house-rules" id="house-rules">
            <div>
              <h2>Before you arrive</h2>
              <p>Our house rules, clearly set out before you book.</p>
            </div>
            <div className="policy-list">
              {loading ? <p>Loading stay information…</p> : detail?.policies?.length ? detail.policies.map((policy) => (
                <details key={`${policy.type}-${policy.title}`}>
                  <summary>
                    {policy.title}
                    <Icon name="plus" />
                  </summary>
                  <p>{displayBrand(policy.body)}</p>
                </details>
              )) : <p>Stay information is unavailable right now. Choose a location above or try your search again.</p>}
            </div>
          </div>
      </section>
      {!roomsPage && <section className="hotel-note" id="hotel">
        <div
          className="hotel-note-image"
          style={{
            backgroundImage: noteImage ? `url("${noteImage}")` : undefined,
          }}
        />
        <div className="hotel-note-copy">
          <h2>{active ? `Stay in ${active.city}` : "Our hotel"}</h2>
          <p>
            {detail?.description ??
              "Thoughtful rooms, a warm welcome, and the freedom to make the stay your own."}
          </p>
          <p className="hotel-location">
            {active?.address ?? "Imaro Hotel, South Africa"}
          </p>
          <a href="#book" className="text-link">
            Plan your stay <Icon name="arrowUpRight" />
          </a>
        </div>
      </section>}

    </div>
  );
}
