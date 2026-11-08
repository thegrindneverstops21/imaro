import { useDraftGuard, useNavigationGuard } from "../../components/ui/NavigationGuard";
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

  const markSaved = useDraftGuard({ name, email, password });

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
      notify("success", creating ? "Account created — welcome to Imaro." : "Welcome back.");
    } catch (cause) {
      const text = message(cause);
      setError(text);
      notify("error", "Sign-in failed", text);
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
        notify("success", "Reset link prepared.");
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
