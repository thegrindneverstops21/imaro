import { useCallback, useEffect, useRef, useState } from "react";
import { useFeedback } from "../../components/ui/Feedback";
import {
  ApiError,
  bookingHeaders,
  json,
  message,
  request,
} from "../../lib/api";
import type { Booking } from "../../types/api";
import { bookingToken, rememberBookingToken } from "./bookingAccess";
import { lookupFailureMessage } from "./lookupRecovery";

const CANCELLED_NOTICE = "Your reservation has been cancelled.";

export type Lookup = { reference: string; token: string };

export type ManagedView =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "ready"; booking: Booking; token: string }
  | { phase: "failed"; message: string };

const bookingPath = (reference: string) =>
  `/bookings/${encodeURIComponent(reference)}`;

export function useManagedBooking(routeReference: string) {
  const { confirm, notify } = useFeedback();
  const [view, setView] = useState<ManagedView>(() =>
    routeReference ? { phase: "loading" } : { phase: "idle" },
  );
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const latest = useRef(0);
  const submitting = useRef(false);

  const find = useCallback(async ({ reference, token }: Lookup) => {
    const id = ++latest.current;
    setView({ phase: "loading" });
    setNotice("");
    setActionError("");
    const usedToken = token || bookingToken(reference);
    try {
      const booking = await request<Booking>(bookingPath(reference), {
        headers: bookingHeaders(usedToken),
      });
      if (id !== latest.current) return;
      if (usedToken) rememberBookingToken(reference, usedToken);
      setView({ phase: "ready", booking, token: usedToken });
    } catch (cause) {
      if (id !== latest.current) return;
      const status = cause instanceof ApiError ? cause.status : undefined;
      setView({ phase: "failed", message: lookupFailureMessage(status) });
    }
  }, []);

  useEffect(() => {
    if (!routeReference) {
      setView({ phase: "idle" });
      return;
    }
    void find({ reference: routeReference, token: "" });
    return () => {
      latest.current++;
    };
  }, [routeReference, find]);

  const cancel = useCallback(async () => {
    if (view.phase !== "ready" || submitting.current) return;
    if (!(await confirm({
      title: "Cancel this reservation?",
      message: "This releases your assigned rooms and cannot be undone here. The hotel’s cancellation terms will apply. A recorded refund does not mean the payment provider has returned money.",
      cancelLabel: "Keep reservation",
      confirmLabel: "Cancel reservation",
      danger: true,
    }))) return;
    submitting.current = true;
    setBusy(true);
    setActionError("");
    const { booking, token } = view;
    const headers = bookingHeaders(token);
    try {
      await request(`${bookingPath(booking.reference)}/cancel`, {
        ...json("POST"),
        headers,
      });
      setNotice(CANCELLED_NOTICE);
      notify("success", CANCELLED_NOTICE);
      try {
        const updated = await request<Booking>(bookingPath(booking.reference), { headers });
        setView({ phase: "ready", booking: updated, token });
      } catch {
        setView({ phase: "failed", message: "Your reservation was cancelled, but the updated details could not load. Look up your booking again to see its current records." });
      }
    } catch (cause) {
      const text = message(cause);
      setActionError(text);
      notify("error", "Could not cancel reservation", text);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }, [view, confirm, notify]);

  return { view, notice, actionError, busy, find, cancel };
}
