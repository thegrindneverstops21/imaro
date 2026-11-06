import { useState } from "react";
import { displayBrand } from "../../lib/format";
import type { Branch } from "../../types/api";
import { TABS, type Tab } from "./adminTypes";
import { BranchesPanel } from "./BranchesPanel";
import { RatesPanel } from "./RatesPanel";
import { ReservationsPanel } from "./ReservationsPanel";
import { RoomsPanel } from "./RoomsPanel";
import { useAdminBranches } from "./useAdminBranches";
import { useAdminWrites } from "./useAdminWrites";
import { useBranchInventory } from "./useBranchInventory";

type HeadingProps = {
  branches: Branch[];
  selected: string;
  disabled: boolean;
  onSelect: (id: string) => void;
};

function AdminHeading({ branches, selected, disabled, onSelect }: HeadingProps) {
  return (
    <div className="admin-heading">
      <div>
        <h1>Hotel operations</h1>
        <p>Manage live reservations, room inventory, branch details, and rates.</p>
      </div>
      <label>
        Branch{" "}
        <select value={selected} disabled={disabled} onChange={(event) => onSelect(event.target.value)}>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {displayBrand(branch.name)} · {branch.city}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

type TabsProps = { tab: Tab; disabled: boolean; onSelect: (tab: Tab) => void };

function AdminTabs({ tab, disabled, onSelect }: TabsProps) {
  return (
    <div className="admin-tabs" role="group" aria-label="Staff sections">
      {TABS.map(({ key, title }) => (
        <button
          key={key}
          aria-pressed={tab === key}
          disabled={disabled}
          className={tab === key ? "active" : ""}
          onClick={() => onSelect(key)}
        >
          {title}
        </button>
      ))}
    </div>
  );
}

function Readiness({
  branch,
  inventory,
  onSelect,
}: {
  branch: Branch | undefined;
  inventory: ReturnType<typeof useBranchInventory>;
  onSelect: (tab: Tab) => void;
}) {
  if (!branch) return null;
  const activeRooms = inventory.rooms.filter((room) => room.status === "active").length;
  const checks = [
    { label: "Published", ready: branch.isPublished !== false, tab: "branches" as Tab },
    { label: "Active rooms", ready: activeRooms > 0, tab: "rooms" as Tab },
    { label: "Nightly rates", ready: inventory.prices.length > 0, tab: "rates" as Tab },
  ];
  const ready = checks.every((check) => check.ready);

  return (
    <section className="admin-readiness" aria-labelledby="readiness-title">
      <div>
        <h2 id="readiness-title">Booking readiness</h2>
        <p>
          {ready
            ? "This property has the essentials for guest bookings."
            : "Complete these steps before directing guests to this property."}
        </p>
      </div>
      <ul>
        {checks.map((check) => (
          <li key={check.label}>
            <span aria-label={check.ready ? "Complete" : "Needs attention"}>
              {check.ready ? "Complete" : "Needs attention"}
            </span>{" "}
            {check.label}
            {!check.ready && (
              <button type="button" className="text-button" onClick={() => onSelect(check.tab)}>
                Fix
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("reservations");
  const writes = useAdminWrites();
  const branches = useAdminBranches();
  const inventory = useBranchInventory(branches.selected);
  const selectedBranch = branches.branches.find(
    (branch) => String(branch.id) === branches.selected,
  );
  const errors = [writes.error, branches.error, inventory.error].filter(Boolean);
  const loadingInventory = inventory.loading && (tab === "rooms" || tab === "rates");
  const common = { branchId: branches.selected, writes };

  return (
    <section className="page-shell admin-shell">
      <AdminHeading
        branches={branches.branches}
        selected={branches.selected}
        disabled={writes.busy}
        onSelect={branches.select}
      />
      {errors.map((error) => (
        <p key={error} className="form-error" role="alert">
          {error}
        </p>
      ))}
      {writes.notice && (
        <p className="inline-message" role="status">
          {writes.notice}
        </p>
      )}
      <Readiness branch={selectedBranch} inventory={inventory} onSelect={setTab} />
      <AdminTabs
        tab={tab}
        disabled={writes.busy}
        onSelect={(next) => {
          setTab(next);
          writes.clearFeedback();
        }}
      />
      <fieldset className="admin-workspace" disabled={writes.busy || loadingInventory}>
        {tab === "reservations" && <ReservationsPanel {...common} />}
        {tab === "rooms" && <RoomsPanel {...common} inventory={inventory} />}
        {tab === "rates" && <RatesPanel {...common} inventory={inventory} />}
        {tab === "branches" && (
          <BranchesPanel branches={branches.branches} reload={branches.reload} writes={writes} />
        )}
      </fieldset>
    </section>
  );
}