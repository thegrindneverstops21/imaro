import { Icon } from "../../components/Icon";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "../../components/aceternity/Reveal";
import { ModernSelect } from "../../components/ui/ModernSelect";
import { ModernDatePicker } from "../../components/ui/ModernDatePicker";
import { HeroSection } from "./HeroSection";
import { RoomCard } from "./RoomCard";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { displayBrand, formatDate, pluralize } from "../../lib/format";
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
  const selectedSlug = linkedSlug;
  function setSelectedSlug(slug: string) {
    const query = new URLSearchParams(location.search);
    if (slug) query.set("branch", slug);
    else query.delete("branch");
    const search = query.toString();
    if (search === new URLSearchParams(location.search).toString()) return;
    navigate({ pathname: location.pathname, search: search ? `?${search}` : "", hash: location.hash });
  }
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
  // Mirrors the server rule roomsNeeded = max(rooms, ceil(guests / capacity)):
  // surface the range across room sizes before the guest picks a room type.
  const capacities = (detail?.roomTypes ?? []).map((room) => room.capacity).filter((capacity) => capacity > 0);
  let roomHint = "";
  if (capacities.length) {
    const neededMin = Math.max(draft.rooms, Math.ceil(draft.guests / Math.max(...capacities)));
    const neededMax = Math.max(draft.rooms, Math.ceil(draft.guests / Math.min(...capacities)));
    if (neededMax > draft.rooms) {
      roomHint = neededMin === neededMax ? `${neededMin}` : `${neededMin}–${neededMax}`;
    }
  }
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
      ) : (
        <HeroSection
          heroRef={heroArea}
          image={image}
          imageAlt={imageAlt}
          caption={active ? `Imaro · ${active.city}` : "Imaro Hotel · South Africa"}
        />
      )}
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
          <ModernSelect
            className="search-field"
            label="Location"
            value={active?.slug ?? ""}
            disabled={!locations.length}
            options={locations.map((branch) => ({ value: branch.slug, label: branch.city }))}
            onChange={setSelectedSlug}
          />
          <ModernDatePicker
            className="search-field"
            label="Check in"
            value={draft.checkIn}
            min={localToday()}
            onChange={(checkIn) => updateStay({ checkIn })}
          />
          <ModernDatePicker
            className="search-field"
            label="Check out"
            value={draft.checkOut}
            min={draft.checkIn ? nextDay(draft.checkIn) : localToday()}
            onChange={(checkOut) => updateStay({ checkOut })}
          />
          <ModernSelect
            className="search-field"
            label="Guests"
            value={String(draft.guests)}
            options={Array.from({ length: 10 }, (_, i) => {
              const n = i + 1;
              return { value: String(n), label: `${n} guest${n > 1 ? "s" : ""}` };
            })}
            onChange={(value) => updateStay({ guests: Number(value) })}
          />
          <ModernSelect
            className="search-field"
            label="Rooms"
            value={String(draft.rooms)}
            options={Array.from({ length: 5 }, (_, i) => {
              const n = i + 1;
              return { value: String(n), label: `${n} room${n > 1 ? "s" : ""}` };
            })}
            onChange={(value) => updateStay({ rooms: Number(value) })}
          />
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Checking rooms…" : "Check availability"} <Icon name="arrowRight" />
          </button>
        </form>
        {validation && <p className="form-error" role="alert">{validation}</p>}
        {changed && !validation && <p className="search-hint" role="status">Dates or guests changed. Check availability to update the room prices below.</p>}
        {roomHint && <p className="search-hint" role="status">Depending on room size, your party may need {roomHint} room{roomHint.includes("–") ? "s" : roomHint === "1" ? "" : "s"}.</p>}
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
                <RoomCard
                  key={room.slug}
                  room={room}
                  photo={photo}
                  branchSlug={active.slug}
                  index={index}
                />
              );
            })}
          </div>
        )}
        {!roomsPage && !loading && !error && rooms.length > 0 && (
          <Link className="button button-outline browse-all" to={`/rooms?branch=${active?.slug ?? ""}`}>
            Explore all rooms <Icon name="arrowRight" />
          </Link>
        )}
          <Reveal className="house-rules-reveal">
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
          </Reveal>
      </section>
      {!roomsPage && <Reveal><section className="hotel-note" id="hotel">
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
      </section></Reveal>}

    </div>
  );
}
