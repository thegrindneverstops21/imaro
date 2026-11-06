import { useState } from "react";
import { SAVED_STAYS } from "../../lib/labels";
import type { User } from "../../types/api";
import { MyBookings } from "./MyBookings";
import { ProfileForm } from "./ProfileForm";
import { SavedStays } from "./SavedStays";

const PROFILE = "My profile";
const BOOKINGS = "My bookings";
const TABS = [PROFILE, BOOKINGS, SAVED_STAYS];

function TabContent({ tab, user }: { tab: string; user: User }) {
  if (tab === BOOKINGS) return <MyBookings />;
  if (tab === SAVED_STAYS) return <SavedStays />;
  return <ProfileForm user={user} />;
}

type Props = { user: User; saved?: boolean };

export function AccountTabs({ user, saved = false }: Props) {
  const [tab, setTab] = useState(saved ? SAVED_STAYS : PROFILE);
  return (
    <>
      <div
        className="location-tabs account-tabs"
        role="group"
        aria-label="Account sections"
      >
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={name === tab}
            className={name === tab ? "active" : ""}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <TabContent tab={tab} user={user} />
    </>
  );
}
