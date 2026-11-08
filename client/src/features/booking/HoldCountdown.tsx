import { Icon } from "../../components/Icon";
import { holdState } from "./holdExpiry";

type HoldCountdownProps = {
  holdExpiresAt: string | null;
  now: number;
};

/** Live mm:dd readout of the server-side room hold; the API stays authoritative. */
export function HoldCountdown({ holdExpiresAt, now }: HoldCountdownProps) {
  const end = holdExpiresAt ? Date.parse(holdExpiresAt) : NaN;

if (!Number.isFinite(end)) return null;
  const state = holdState(holdExpiresAt, now);
  if (state === "expired") {
    return <span className="hold-countdown expired">This hold has expired.</span>;
  }
  const totalSeconds = Math.max(0, Math.ceil((end - now) / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return (
    <span className={`hold-countdown ${state}`} role="timer">
      <Icon name="clock" />
      {minutes}:{seconds} remaining
    </span>
  );
}
