import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { json, message, request } from "../../lib/api";
import { useAccountData } from "./useAccountData";

type Notice = { id: number; title: string; message: string; isRead: boolean; reference: string | null };
export function NotificationBell() {
  const { data, error, reload } = useAccountData<Notice[]>("/me/notifications");
  const toggle = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [failure, setFailure] = useState("");
  const unread = data?.filter((notice) => !notice.isRead).length ?? 0;
  async function read(id: number) {
    try { await request(`/me/notifications/${id}/read`, json("PATCH")); reload(); }
    catch (cause) { setFailure(message(cause)); }
  }
  return <div className="notification-bell" onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } }}>
    <button ref={toggle} className="button button-quiet" aria-label={`Notifications, ${unread} unread`} aria-expanded={open} aria-controls="notifications" onClick={() => { setOpen(!open); if (!open) reload(); }}><Icon name="bell" />{unread > 0 && <span>{unread}</span>}</button>
    {open && <section className="notification-panel panel" id="notifications" aria-label="Notifications">
      <h2>Notifications</h2><button className="text-button" onClick={() => setOpen(false)}>Close</button>
      {(error || failure) && <p role="alert">{error || failure} <button onClick={reload}>Try again</button></p>}
      {!data && !error && <p role="status">Loading notifications…</p>}
      {data?.length === 0 && <p>You’re all caught up.</p>}
      {data?.map((notice) => <article key={notice.id}><h3>{notice.title}</h3><p>{notice.message}</p>
        {notice.reference && <Link onClick={() => setOpen(false)} to={`/booking/${encodeURIComponent(notice.reference)}`}>View booking</Link>}{" "}
        {!notice.isRead && <button className="text-button" onClick={() => void read(notice.id)}>Mark as read</button>}
      </article>)}
    </section>}
  </div>;
}
