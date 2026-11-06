import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Icon } from "../../components/Icon";
import { json, message, request } from "../../lib/api";
import { setUser, type AppDispatch } from "../../app/store";
import { safePath, takeSignInNext } from "../../lib/authIntent";
import type { User } from "../../types/api";

type Session = { token: string; user: User };

export function SignInPage({ onGoogle }: { onGoogle: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
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
    () => new URLSearchParams(location.search).get("error") ?? "",
  );
  const [busy, setBusy] = useState(false);
  const nextPath = safePath(new URLSearchParams(location.search).get("next"));
  const staffIntent = nextPath === "/admin";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = await request<Session>(
        creating ? "/auth/register" : "/auth/login",
        json("POST", creating ? { name, email, password } : { email, password }),
      );
      localStorage.setItem("imaro.session", session.token);
      dispatch(setUser(session.user));
      const remembered = takeSignInNext();
      const requested = safePath(new URLSearchParams(location.search).get("next")) || remembered;
      // Replace the sign-in page in history, so Back never lands on a stale form.
      navigate(requested || "/", { replace: true });
    } catch (cause) {
      setError(message(cause));
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
      if (result.resetToken) {
        window.location.assign(`/reset-password?token=${encodeURIComponent(result.resetToken)}`);
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
      <p className="eyebrow">YOUR IMARO</p>
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
      {resetNotice && <p className="inline-message" role="status">{resetNotice}</p>}

      <form className="auth-form" onSubmit={resetMode ? requestReset : submit}>
        {!resetMode && creating && (
          <label>
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </label>
        )}
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
          {busy ? "Please wait…" : resetMode ? "Send reset link" : creating ? "Create account" : "Sign in"}
        </button>
      </form>

      {!resetMode && !creating && <p className="auth-switch">
        <button type="button" className="text-button" onClick={() => { setResetMode(true); setError(""); }}>
          Forgot password?
        </button>
      </p>}
      <p className="auth-switch">
        {creating ? "Already have an account?" : "New to Imaro?"}{" "}
        <button
          type="button"
          className="text-button"
          onClick={() => {
            if (resetMode) {
              setResetMode(false);
              setError("");
              return;
            }
            setCreating(!creating);
            setError("");
          }}
        >
          {creating ? "Sign in" : "Create an account"}
        </button>
      </p>

      <p className="auth-divider">
        <span>or</span>
      </p>
      <button className="button button-outline auth-google" onClick={onGoogle}>
        Continue with Google
      </button>

      <p>
        <Link to="/manage">
          Find a booking using its reference <Icon name="arrowRight" />
        </Link>
      </p>
    </section>
  );
}
