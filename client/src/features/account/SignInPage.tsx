import { usePendingChanges, useNavigationGuard } from "../../components/ui/NavigationGuard";
import { SuccessBanner } from "../../components/ui/SuccessBanner";
import { Form } from "../../components/ui/Form";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Icon } from "../../components/Icon";
import { json, message, request } from "../../lib/api";
import { setUser, type AppDispatch } from "../../app/store";
import { useFeedback } from "../../components/ui/Feedback";
import { Modal, ModalBody, ModalContent, ModalHeader } from "../../components/ui";
import { safePath, takeSignInNext } from "../../lib/authIntent";
import type { User } from "../../types/api";

type Session = { token: string; user: User };

function GoogleMark() {
  return (
    <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.35 12.23c0-.7-.06-1.37-.18-2.02H12v3.83h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.2Z" />
      <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.48-4.03H3.27v2.53A9.75 9.75 0 0 0 12 21.75Z" />
      <path fill="#FBBC05" d="M6.52 13.84A5.86 5.86 0 0 1 6.22 12c0-.64.11-1.26.3-1.84V7.63H3.27A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.02 4.37l3.25-2.53Z" />
      <path fill="#EA4335" d="M12 6.13c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.21 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.73 5.38l3.25 2.53C7.3 7.85 9.46 6.13 12 6.13Z" />
    </svg>
  );
}

export function SignInPage({ onGoogle }: { onGoogle: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const { notify } = useFeedback();
  const { confirmLeave, clear } = useNavigationGuard();
  const navigate = useNavigate();
  const location = useLocation();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetNotice, setResetNotice] = useState("");
  const [error, setError] = useState(
    () => new URLSearchParams(location.search).has("error") ? "We couldn�t complete sign-in. Please try again or sign in with your email." : "",
  );
  const [busy, setBusy] = useState(false);
  const nextPath = safePath(new URLSearchParams(location.search).get("next"));
  const staffIntent = nextPath === "/admin";

  const markSaved = usePendingChanges(creating && Boolean(name.trim() || email.trim() || password));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = await request<Session>(
        creating ? "/auth/register" : "/auth/login",
        json("POST", creating ? { name, email, password } : { email, password }),
      );
      markSaved();
      localStorage.setItem("imaro.session", session.token);
      dispatch(setUser(session.user));
      const remembered = takeSignInNext();
      const requested = safePath(new URLSearchParams(location.search).get("next")) || remembered;
      // Replace the sign-in page in history, so Back never lands on a stale form.
      navigate(requested || "/", { replace: true });
      if (creating) notify("success", "Account created — welcome to Imaro.");
    } catch (cause) {
      const text = message(cause);
      setError(text);
      setBusy(false);
    }

  }

  async function requestReset(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResetNotice("");
    try {
      const result = await request<{ message: string; resetToken?: string }>(
        "/auth/password-reset/request",
        json("POST", { email }),
      );
      markSaved();
      if (result.resetToken) {
        navigate(`/reset-password?token=${encodeURIComponent(result.resetToken)}`);
      } else {
        setResetNotice(result.message);
      }
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-shell narrow auth-page">
      <h1>{resetMode ? "Reset your password." : creating ? "Create your account." : "Welcome back."}</h1>
      <p>
        {resetMode
          ? "Enter your email and we’ll prepare a secure reset link."
          : creating
          ? "Save the stays you like and keep every reservation in one place."
          : "Sign in to see your bookings and saved stays."}
      </p>
      {nextPath && (
        <p className="small-note">
          You’ll go back to the page you were viewing once you continue.
        </p>
      )}
      {staffIntent && (
        <p className="small-note">
          Staff access uses the password account supplied in the project README.
          Google sign-in is optional.
        </p>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {resetNotice && <SuccessBanner>{resetNotice}</SuccessBanner>}

      <Form className="auth-form" onSubmit={resetMode ? requestReset : submit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        {!resetMode && <label>
          Password
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={creating ? "new-password" : "current-password"}
            minLength={creating ? 8 : undefined}
            required
          />
          <button
            type="button"
            className="text-button"
            aria-pressed={showPassword}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? "Hide password" : "Show password"}
          </button>
          {creating && <small>At least 8 characters.</small>}
        </label>}
        <button className="button" disabled={busy}>
          {busy ? "Please wait…" : resetMode ? "Send reset link" : "Sign in"}
        </button>
      </Form>

      {!resetMode && !creating && <p className="auth-switch">
        <button type="button" className="text-button" onClick={async () => { if (!(await confirmLeave())) return; setPassword(""); setName(""); setResetMode(true); setError(""); }}>
          Forgot password?
        </button>
      </p>}
      <p className="auth-switch">
        New to Imaro?{" "}
        <button
          type="button"
          className="text-button"
          onClick={async () => {
            if (!(await confirmLeave())) return;
            setPassword(""); setName(""); setResetMode(false); setError(""); setCreating(true);
            setError("");
          }}
        >
          Create an account
        </button>
      </p>

      <button className="button button-outline auth-google" onClick={async () => { if (await confirmLeave()) { clear(); onGoogle(); } }}>
        <GoogleMark />
        Continue with Google
      </button>

      <p>
        <Link to="/manage">
          Find a booking using its reference <Icon name="arrowRight" />
        </Link>
      </p>
      <Modal
        isOpen={creating}
        onOpenChange={(open) => {
          if (!open) setCreating(false);
        }}
        size="5xl"
        placement="center"
        classNames={{ base: "account-create-modal", body: "account-create-modal-body" }}
      >
        <ModalContent>
          <ModalHeader>
            <div>
              <h2>Create your Imaro account</h2>
              <p>Save your details once for faster booking and payment.</p>
            </div>
          </ModalHeader>
          <ModalBody>
            <button
              type="button"
              className="button account-google-primary"
              onClick={async () => { if (await confirmLeave()) { clear(); onGoogle(); } }}
            >
              <GoogleMark />
              Continue with Google
            </button>
            <p className="auth-divider"><span>or</span></p>
            <Form className="account-create-form" onSubmit={(event) => void submit(event)}>
              <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label>
              <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
              <label>Password<input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required /><small>At least 8 characters.</small></label>
              <p className="account-consent">By creating an account, you agree to our <Link to="/privacy">Privacy Policy</Link>.</p>
              {error && <p className="form-error account-create-error" role="alert">{error}</p>}
              <button className="button account-create-submit" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
            </Form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </section>
  );
}
