import { useDraftGuard } from "../../components/ui/NavigationGuard";
import { SuccessBanner } from "../../components/ui/SuccessBanner";
import { Form } from "../../components/ui/Form";
import { useState, type FormEvent } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "../../app/store";
import { Input } from "../../components/ui";
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
      const profile = await request<User>("/me", json("PATCH", { name, phone }));
      markSaved(); dispatch(setUser(profile)); setSaved(true);
      notify("success", "Profile saved.");
    } catch (cause) { const text = message(cause); setNotice(text); notify("error", "Could not save profile", text); }
    finally { setBusy(false); }
  }
  return <Form className="lookup-form panel" onSubmit={(event) => void save(event)}>
    <Input className="heroui-control" label="Name" isRequired maxLength={150} autoComplete="name" value={name} onValueChange={(value) => { setSaved(false); setName(value); }} />
    <Input className="heroui-control" label="Phone" type="tel" isRequired minLength={5} maxLength={40} autoComplete="tel" value={phone} onValueChange={(value) => { setSaved(false); setPhone(value); }} />
    <p>{user.email}</p><button className="button" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
    {saved && <SuccessBanner>Profile saved.</SuccessBanner>}
    {notice && <p className="form-error" role="alert">{notice}</p>}
  </Form>;
}
