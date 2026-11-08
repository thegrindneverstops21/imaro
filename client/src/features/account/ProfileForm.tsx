import { useState, type FormEvent } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "../../app/store";
import { Input } from "../../components/ui";
import { json, message, request } from "../../lib/api";
import type { User } from "../../types/api";

export function ProfileForm({ user }: { user: User }) {
  const dispatch = useDispatch();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      const profile = await request<User>("/me", json("PATCH", { name, ...(phone ? { phone } : {}) }));
      dispatch(setUser(profile)); setNotice("Profile saved.");
    } catch (cause) { setNotice(message(cause)); }
    finally { setBusy(false); }
  }
  return <form className="lookup-form panel" onSubmit={(event) => void save(event)}>
    <Input className="heroui-control" label="Name" isRequired maxLength={150} autoComplete="name" value={name} onValueChange={setName} />
    <Input className="heroui-control" label="Phone" type="tel" minLength={5} maxLength={40} autoComplete="tel" value={phone} onValueChange={setPhone} />
    <p>{user.email}</p><button className="button" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
    {notice && <p role="status">{notice}</p>}
  </form>;
}
