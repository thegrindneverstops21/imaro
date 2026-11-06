import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { json, message, request } from "../../lib/api";

export function PasswordResetPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await request<{ message: string }>(
        "/auth/password-reset/complete",
        json("POST", { token, password }),
      );
      setStatus(result.message);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-shell narrow auth-page">
      <h1>Choose a new password.</h1>
      {!token ? (
        <p className="form-error" role="alert">This reset link is missing or invalid.</p>
      ) : status ? (
        <>
          <p className="inline-message" role="status">{status}</p>
          <Link className="button" to="/login">Sign in</Link>
        </>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          {error && <p className="form-error" role="alert">{error}</p>}
          <label>
            New password
            <input
              type={showPassword ? "text" : "password"}
              minLength={8}
              required
              value={password}
              autoComplete="new-password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label>
            Confirm password
            <input
              type={showPassword ? "text" : "password"}
              minLength={8}
              required
              value={confirm}
              autoComplete="new-password"
              onChange={(event) => setConfirm(event.target.value)}
            />
          </label>
          <button type="button" className="text-button" aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
            {showPassword ? "Hide password" : "Show password"}
          </button>
          <button className="button" disabled={busy}>{busy ? "Saving…" : "Update password"}</button>
        </form>
      )}
    </section>
  );
}
