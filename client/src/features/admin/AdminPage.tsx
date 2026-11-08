import { Select, SelectItem } from "../../components/ui";
import { Icon } from "../../components/Icon";
import { NotificationBell } from "../account/NotificationBell";
import { Link, useSearchParams } from "react-router-dom";
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
        <p>Your property, at a glance.</p>
      </div>
      <Select
        className="property-switcher heroui-control"
        classNames={{ trigger: "property-switcher-trigger", label: "property-switcher-label", value: "property-switcher-value", popoverContent: "property-switcher-menu" }}
        label="Location"
        labelPlacement="outside"
        placeholder="No properties available"
        selectedKeys={selected ? [selected] : []}
        isDisabled={disabled || !branches.length}
        disallowEmptySelection
        onSelectionChange={(keys) => {
          if (keys === "all") return;
          const key = [...keys][0];
          if (key != null && String(key) !== selected) onSelect(String(key));
        }}
        popoverProps={{ placement: "bottom-end", offset: 8 }}
        listboxProps={{ classNames: { base: "property-menu-wrapper", list: "property-menu-list" }, itemClasses: { base: "property-switcher-option" } }}
      >
        {branches.map((branch) => {
          const name = displayBrand(branch.name);
          const city = branch.city.trim();
          const sharedCity = branches.filter((item) => item.city.trim().toLocaleLowerCase() === city.toLocaleLowerCase()).length > 1;
          const title = city ? (sharedCity ? `${city} · ${name}` : city) : name;
          return <SelectItem key={String(branch.id)} textValue={title}>{title}</SelectItem>;
        })}
      </Select>
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
  if (!branch || inventory.loading || inventory.error || !inventory.loaded) return null;
  const activeRooms = inventory.rooms.filter((room) => room.status === "active").length;
  const checks = [
    { label: "Published", ready: branch.isPublished !== false, tab: "branches" as Tab },
    { label: "Active rooms", ready: activeRooms > 0, tab: "rooms" as Tab },
    { label: "Nightly rates", ready: inventory.prices.length > 0, tab: "rates" as Tab },
  ];
  const ready = checks.every((check) => check.ready);
  if (ready) return null;

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
        {checks.filter((check) => !check.ready).map((check) => (
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

export function AdminPage({ onSignOut, userName }: { onSignOut: () => void; userName: string }) {
  const [params, setParams] = useSearchParams();
  const tab: Tab = TABS.find((item) => item.key === params.get("section"))?.key ?? "reservations";
  function setTab(next: Tab) {
    setParams((current) => { const query = new URLSearchParams(current); query.set("section", next); return query; });
  }
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
    <section className="admin-dashboard">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin">IMARO<span>Hotel management</span></Link>
              <AdminTabs
        tab={tab}
        disabled={writes.busy}
        onSelect={(next) => {
          setTab(next);
          writes.clearFeedback();
        }}
      />

        <div className="admin-sidebar-bottom">
          <Link to="/">View hotel website <Icon name="arrowUpRight" /></Link>
          <button type="button" onClick={onSignOut}>Sign out</button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <span>Imaro / {TABS.find((item) => item.key === tab)?.title}</span>
          <div className="admin-user"><NotificationBell /><Link to="/profile">{userName}</Link></div>
        </header>
        <div className="page-shell admin-shell">
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
      <div className="admin-overview" aria-label="Selected property overview">
        <div><span>Active rooms</span><strong>{inventory.loading || !inventory.loaded ? "—" : inventory.rooms.filter((room) => room.status === "active").length}</strong><small>In this property's inventory</small></div>
        <div><span>Rooms in maintenance</span><strong>{inventory.loading || !inventory.loaded ? "—" : inventory.rooms.filter((room) => room.status === "maintenance").length}</strong><small>Unavailable for allocation</small></div>
        <div><span>Room types with rates</span><strong>{inventory.loading || !inventory.loaded ? "—" : inventory.prices.length}</strong><small>Nightly pricing configured</small></div>
        <div><span>Guest visibility</span><strong className="admin-visibility">{selectedBranch ? selectedBranch.isPublished === false ? "Unpublished" : "Published" : "—"}</strong><small>{selectedBranch?.city ?? "Select a property"}</small></div>
      </div>
      <fieldset className="admin-workspace" disabled={writes.busy || loadingInventory}>
        {tab === "reservations" && <ReservationsPanel {...common} />}
        {tab === "rooms" && <RoomsPanel key={branches.selected} {...common} inventory={inventory} />}
        {tab === "rates" && <RatesPanel key={branches.selected} {...common} inventory={inventory} />}
        {tab === "branches" && (
          <BranchesPanel branches={branches.branches} reload={branches.reload} writes={writes} />
        )}
      </fieldset>
        </div>
      </div>
    </section>
  );
}