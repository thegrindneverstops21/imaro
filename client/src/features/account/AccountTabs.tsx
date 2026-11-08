import { useState } from "react";
import { Tab, Tabs } from "../../components/ui";
import { SAVED_STAYS } from "../../lib/labels";
import type { User } from "../../types/api";
import { MyBookings } from "./MyBookings";
import { ProfileForm } from "./ProfileForm";
import { SavedStays } from "./SavedStays";

const PROFILE = "profile";
const BOOKINGS = "bookings";
const SAVED = "saved";

type Props = { user: User; saved?: boolean };

export function AccountTabs({ user, saved = false }: Props) {
  const [tab, setTab] = useState(saved ? SAVED : PROFILE);
  return (
    <Tabs
      aria-label="Account sections"
      selectedKey={tab}
      onSelectionChange={(keys) => {
        if (keys === "all") return;
        setTab(String(keys));
      }}
    >
      <Tab key={PROFILE} title="My profile">
        <ProfileForm user={user} />
      </Tab>
      <Tab key={BOOKINGS} title="My bookings">
        <MyBookings />
      </Tab>
      <Tab key={SAVED} title={SAVED_STAYS}>
        <SavedStays />
      </Tab>
    </Tabs>
  );
}
