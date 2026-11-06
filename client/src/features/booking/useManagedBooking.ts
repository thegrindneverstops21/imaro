import { useCallback, useEffect, useRef, useState } from "react";
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

const CANCEL_PROMPT =
  "Cancel this reservation? The hotel’s cancellation terms will apply.";
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
    if (!window.confirm(CANCEL_PROMPT)) return;
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
      const updated = await request<Booking>(bookingPath(booking.reference), {
        headers,
      });
      setView({ phase: "ready", booking: updated, token });
      setNotice(CANCELLED_NOTICE);
    } catch (cause) {
      setActionError(message(cause));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }, [view]);

  return { view, notice, actionError, busy, find, cancel };
}
