import { useFeedback } from "../../components/ui/Feedback";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { json, message, request } from "../../lib/api";
import { useAccountData } from "./useAccountData";

type Notice = { id: number; title: string; message: string; isRead: boolean; reference: string | null };
export function NotificationBell() {
  const { notify } = useFeedback();
  const { data, error, reload } = useAccountData<Notice[]>("/me/notifications");
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [failure, setFailure] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, maxHeight: 400 });
  const unread = data?.filter((notice) => !notice.isRead).length ?? 0;
  function close() { setOpen(false); toggle.current?.focus(); }

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const anchor = toggle.current?.getBoundingClientRect();
      if (!anchor) return;
      const width = Math.min(384, window.innerWidth - 32);
      const top = Math.max(16, Math.min(anchor.bottom + 10, window.innerHeight - 200));
      setPosition({ top, left: Math.max(16, Math.min(anchor.right - width, window.innerWidth - width - 16)), maxHeight: Math.max(120, window.innerHeight - top - 16) });
    }
    place();
    closeButton.current?.focus();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !toggle.current?.contains(target)) setOpen(false);
    }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } }
    function focusAway(event: FocusEvent) {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !toggle.current?.contains(target)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    document.addEventListener("focusin", focusAway);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); document.removeEventListener("focusin", focusAway); };
  }, [open]);

  async function read(id: number) {
    setFailure("");
    try { await request(`/me/notifications/${id}/read`, json("PATCH")); notify("success", "Notification marked as read."); reload(); }
    catch (cause) { setFailure(message(cause)); }
  }
  return <div className="notification-bell">
    <button ref={toggle} type="button" className="button button-quiet" aria-label={`Notifications, ${unread} unread`} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => { setOpen(!open); if (!open) { setFailure(""); reload(); } }}><Icon name="bell" />{unread > 0 && <span>{unread}</span>}</button>
    {open && createPortal(<section ref={panel} className="notification-panel notification-popover" id={id} aria-labelledby={`${id}-title`} style={position}>
      <div className="notification-panel-heading">
        <h2 id={`${id}-title`}>Notifications</h2>
        <button ref={closeButton} type="button" aria-label="Close notifications" onClick={close}><Icon name="close" /></button>
      </div>
      <div className="notification-panel-content">
        {(error || failure) && <p role="alert">{error || failure} <button type="button" onClick={() => { setFailure(""); reload(); }}>Try again</button></p>}
        {!data && !error && <p role="status">Loading notifications…</p>}
        {!error && data?.length === 0 && <div className="notification-empty"><Icon name="bell" /><p>You’re all caught up.</p><span>Booking updates will appear here.</span></div>}
        {data?.map((notice) => <article key={notice.id} className={notice.isRead ? "" : "notification-unread"}><h3>{notice.title}</h3><p>{notice.message}</p>
          {notice.reference && <Link onClick={() => setOpen(false)} to={`/booking/${encodeURIComponent(notice.reference)}`}>View booking</Link>}{" "}
          {!notice.isRead && <button type="button" className="text-button" onClick={() => void read(notice.id)}>Mark as read</button>}
        </article>)}
      </div>
    </section>, document.body)}
  </div>;
}
