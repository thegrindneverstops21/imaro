import { HotelInfoPage } from "../features/browse/HotelInfoPage";
import { Icon } from "../components/Icon";
import { useEffect, useRef, useState } from "react";
import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { request, message } from "../lib/api";
import type { Branch, User } from "../types/api";
import { setFavorites, setUser, type AppDispatch, type RootState } from "./store";
import { PaymentReturnPage } from "../features/booking/PaymentReturnPage";
import { NotificationBell } from "../features/account/NotificationBell";
import { BrowsePage } from "../features/browse/BrowsePage";
import { BookingPage } from "../features/booking/BookingPage";
import { ManagePage } from "../features/booking/ManagePage";
import { RoomDetailsPage } from "../features/booking/RoomDetailsPage";
import { ReviewPage } from "../features/booking/ReviewPage";
import { ConfirmationPage } from "../features/booking/ConfirmationPage";
import { AdminPage } from "../features/admin/AdminPage";
import { StaffGate } from "../features/admin/StaffGate";
import { ProfilePage } from "../features/account/ProfilePage";
import { SignInPage } from "../features/account/SignInPage";
import { PasswordResetPage } from "../features/account/PasswordResetPage";
import { SAVED_STAYS } from "../lib/labels";
import { rememberSignInNext, signInLink, takeSignInNext } from "../lib/authIntent";

export function App() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [bookingVisible, setBookingVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const menuButton = useRef<HTMLButtonElement>(null);
  const checkout = /^\/(stay|review|confirmation|payment|manage|booking|admin)(\/|$)/.test(location.pathname);
  const overHero = location.pathname === "/" && heroVisible;
  // Signing in from any page returns the guest to the page they were on.
  const signInTarget =
    location.pathname === "/login"
      ? `${location.pathname}${location.search}`
      : signInLink(`${location.pathname}${location.search}${location.hash}`);
  useEffect(() => {
    const page = location.pathname.split("/")[1];
    const names: Record<string, string> = { rooms: "Rooms & suites", room: "Room details", hotel: "Our hotel", contact: "Contact", "stay-information": "Stay information", stay: "Guest details", review: "Review & payment", confirmation: "Reservation status", manage: "Manage booking", booking: "Your booking", payment: "Payment status", profile: "Your account", favorites: SAVED_STAYS, login: "Sign in", admin: "Hotel operations" };
    document.title = page ? `${names[page] ?? "Page not found"} | Imaro Hotel` : "Imaro Hotel — A place to settle in";
  }, [location.pathname]);


  useEffect(() => {
    if (!navOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setNavOpen(false);
      menuButton.current?.focus();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [navOpen]);

  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    void request<Branch[]>("/me/favourites", { signal: controller.signal })
      .then((branches) => dispatch(setFavorites(branches.map((branch) => branch.slug))))
      .catch((cause: unknown) => { if (!controller.signal.aborted) setNotice(message(cause)); });
    return () => controller.abort();
  }, [dispatch, user?.id]);

  // Reads the token from the URL after a Google sign-in, then removes it from the address bar so it is not shared or bookmarked.
  useEffect(() => {
    const token = new URLSearchParams(location.hash.slice(1)).get("token");
    if (!token) return;
    localStorage.setItem("imaro.session", token);
    window.history.replaceState(
      null,
      "",
      `${location.pathname}${location.search}`,
    );
    void request<User>("/me")
      .then((profile) => {
        dispatch(setUser(profile));
        navigate(takeSignInNext() || "/", { replace: true });
      })
      .catch(() => {
        localStorage.removeItem("imaro.session");
        setNotice("Sign-in could not be verified. Please try again.");
        navigate("/login", { replace: true });
      });
  }, [dispatch, location.hash, location.pathname, location.search, navigate]);

  // On first load, if a session token is stored, ask the API who it belongs to, discard it if it's invalid.
  useEffect(() => {
    if (!localStorage.getItem("imaro.session")) {
      dispatch(setUser(null));
      return;
    }
    void request<User>("/me")
      .then((profile) => dispatch(setUser(profile)))
      .catch(() => {
        localStorage.removeItem("imaro.session");
        dispatch(setUser(null));
      });
  }, [dispatch]);

  // Sign-in is a full page redirect to Google; the API builds the URL for us.
  async function signIn() {
    const next = new URLSearchParams(location.search).get("next");
    if (next) rememberSignInNext(next);
    try {
      const result = await request<{ authorizationUrl: string }>(
        "/auth/google",
      );
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      setNotice(message(error));
    }
  }

  function signOut() {
    localStorage.removeItem("imaro.session");
    dispatch(setUser(null));
    setNotice("You have signed out.");
  }

  // Each <Route> maps a URL to a page; "*" is the fallback for unknown URLs.
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className={`site-header guest-header ${overHero ? "over-hero" : ""} ${bookingVisible || !["/", "/rooms"].includes(location.pathname) ? "booking-visible" : ""}`}>
        <Link className="wordmark" to="/">
          IMARO<small>Hotel · South Africa</small>
        </Link>
        <nav id="guest-navigation" className={navOpen ? "open" : ""} aria-label="Main navigation">
          <Link to="/rooms" aria-current={location.pathname === "/rooms" ? "page" : undefined} onClick={() => setNavOpen(false)}>
            Rooms & suites
          </Link>
          <Link to="/hotel" onClick={() => setNavOpen(false)}>
            Our hotel
          </Link>
          <Link to="/manage" onClick={() => setNavOpen(false)}>
            Manage booking
          </Link>
          {user?.role === "admin" && <Link className="mobile-account" to="/admin" onClick={() => setNavOpen(false)}>Staff console</Link>}
          {user && <button className="mobile-sign-out text-button" onClick={() => { signOut(); setNavOpen(false); }}>Sign out</button>}
          {user ? <Link className="mobile-account" to="/profile" onClick={() => setNavOpen(false)}>My profile</Link> : <Link className="mobile-account" to={signInTarget} onClick={() => setNavOpen(false)}>Sign in</Link>}
        </nav>
        <div className="account-actions">
          {user && <NotificationBell key={user.id} />}
          {user ? (
            <>
              <Link to="/profile" className="user-link">
                {user.name.split(" ")[0]}
              </Link>
              <button className="button button-quiet desktop-sign-out" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <Link className="button button-quiet desktop-sign-in" to={signInTarget}>
              Sign in
            </Link>
          )}
          {!checkout && <Link className="button header-book" to={location.pathname === "/rooms" ? "/rooms#book" : "/#book"}>
            <span className="desktop-book-label">Book your stay</span><span className="mobile-book-label">Book</span>
          </Link>}
          {user?.role === "admin" && (
            <Link to="/admin" className="staff-link">
              Staff
            </Link>
          )}
          <button
            className="menu-toggle"
            ref={menuButton}
            aria-label={navOpen ? "Close menu" : "Open menu"}
            aria-controls="guest-navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(!navOpen)}
          >
            <Icon name={navOpen ? "close" : "menu"} />
          </button>
        </div>
      </header>
      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <Icon name="close" />
          </button>
        </div>
      )}
      {/* Routes are matched top to bottom; the first match wins. */}
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<BrowsePage onBookingVisibility={setBookingVisible} onHeroVisibility={setHeroVisible} />} />
          <Route path="/rooms" element={<BrowsePage roomsPage onBookingVisibility={setBookingVisible} />} />
          <Route path="/hotel" element={<HotelInfoPage section="hotel" />} />
          <Route path="/stay-information" element={<HotelInfoPage section="stay-information" />} />
          <Route path="/contact" element={<HotelInfoPage section="contact" />} />
          <Route path="/favorites" element={<ProfilePage user={user} saved onSignIn={() => navigate("/login?next=%2Ffavorites")} />} />
          <Route path="/payment/return" element={<PaymentReturnPage />} />
          <Route path="/payment/cancelled" element={<PaymentReturnPage cancelled />} />
          <Route path="/room/:slug/:roomType" element={<RoomDetailsPage />} />
          <Route path="/stay/:slug/:roomType" element={<BookingPage />} />
          <Route path="/review/:reference" element={<ReviewPage />} />
          <Route
            path="/confirmation/:reference"
            element={<ConfirmationPage />}
          />
          <Route path="/booking/:reference" element={<ManagePage />} />
          <Route path="/manage" element={<ManagePage />} />
          <Route
            path="/profile"
            element={<ProfilePage user={user} onSignIn={() => navigate("/login?next=%2Fprofile")} />}
          />
          <Route
            path="/auth/callback"
            element={
              <div className="page-shell">
                <h1>Signing you in…</h1>
              </div>
            }
          />
          <Route
            path="/login"
            element={<SignInPage onGoogle={() => void signIn()} />}
          />
          <Route path="/reset-password" element={<PasswordResetPage />} />
                    <Route
            path="/admin"
            element={
              <StaffGate user={user}>
                <AdminPage />
              </StaffGate>
            }
          />
          <Route path="*" element={<div className="page-shell"><h1>Page not found</h1><p>Return to Imaro to find a room or manage your stay.</p><Link className="button" to="/">Back to home</Link></div>} />
        </Routes>
      </main>
      <footer className="site-footer guest-footer">
        <div>
          <Link className="wordmark" to="/">
            IMARO<small>Hotel · South Africa</small>
          </Link>
          <p>Find your place. Make yourself at home.</p>
        </div>
        <p>
          Imagery is illustrative. Prices are in South African rand and include VAT.
        </p>
        <div className="footer-links">
          <Link to="/rooms">Rooms & suites</Link>
          <Link to="/stay-information">Stay information</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/manage">Manage a reservation</Link>
          <Link to="/favorites">Saved stays</Link>
          {user?.role === "admin" && <Link to="/admin">Staff console</Link>}
        </div>
      </footer>
    </>
  );
}
