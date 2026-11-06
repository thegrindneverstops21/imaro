import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Icon } from "../../components/Icon";
import { json, message, request } from "../../lib/api";
import { setUser, type AppDispatch } from "../../app/store";
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
  const [error, setError] = useState(
    () => new URLSearchParams(location.search).get("error") ?? "",
  );
  const [busy, setBusy] = useState(false);

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
      navigate("/profile", { replace: true });
    } catch (cause) {
      setError(message(cause));
      setBusy(false);
    }
  }

  return (
    <section className="page-shell narrow auth-page">
      <p className="eyebrow">YOUR IMARO</p>
      <h1>{creating ? "Create your account." : "Welcome back."}</h1>
      <p>
        {creating
          ? "Save the stays you like and keep every reservation in one place."
          : "Sign in to see your bookings and saved stays."}
      </p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <form className="auth-form" onSubmit={submit}>
        {creating && (
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
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={creating ? "new-password" : "current-password"}
            minLength={creating ? 8 : undefined}
            required
          />
          {creating && <small>At least 8 characters.</small>}
        </label>
        <button className="button" disabled={busy}>
          {busy ? "Please wait…" : creating ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="auth-switch">
        {creating ? "Already have an account?" : "New to Imaro?"}{" "}
        <button
          type="button"
          className="text-button"
          onClick={() => {
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
