import { useDraftGuard } from "../../components/ui/NavigationGuard";
import { SuccessBanner } from "../../components/ui/SuccessBanner";
import { Form } from "../../components/ui/Form";
import { useState, type FormEvent } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "../../app/store";
import { useFeedback } from "../../components/ui/Feedback";
import { json, message, request } from "../../lib/api";
import type { User } from "../../types/api";

export function ProfileForm({ user }: { user: User }) {
  const dispatch = useDispatch();
  const { notify } = useFeedback();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(false);
  const markSaved = useDraftGuard({ name, phone });
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice(""); setSaved(false);
    try {
      const trimmedPhone = phone.trim();
      const profile = await request<User>("/me", json("PATCH", {
        name,
        ...(trimmedPhone ? { phone: trimmedPhone } : {}),
      }));
      markSaved(); dispatch(setUser(profile)); setSaved(true);
      notify("success", "Profile saved.");
    } catch (cause) { const text = message(cause); setNotice(text); notify("error", "Could not save profile", text); }
    finally { setBusy(false); }
  }
  return <Form className="lookup-form panel profile-form" onSubmit={(event) => void save(event)}>
    <div className="form-grid">
      <label>
        Full name
        <input name="name" autoComplete="name" required maxLength={150} value={name} onChange={(event) => { setSaved(false); setName(event.target.value); }} />
      </label>
      <label>
        Phone <small>Optional</small>
        <input name="phone" type="tel" autoComplete="tel" minLength={5} maxLength={40} value={phone} onChange={(event) => { setSaved(false); setPhone(event.target.value); }} />
      </label>
    </div>
    <div className="profile-email">
      <span className="profile-field-label">Email</span>
      <span className="profile-field-value">{user.email}</span>
    </div>
    <p className="small-note">Your email is your sign-in, so it stays as it is.</p>
    <button className="button" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
    {saved && <SuccessBanner>Profile saved.</SuccessBanner>}
    {notice && <p className="form-error" role="alert">{notice}</p>}
  </Form>;
}
