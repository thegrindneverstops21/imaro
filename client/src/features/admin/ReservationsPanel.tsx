import { useNavigationGuard } from "../../components/ui/NavigationGuard";
import { Form } from "../../components/ui/Form";
import { Select, SelectItem } from "../../components/ui";
import { useState, type FormEvent } from "react";
import { BOOKING_STATUSES, readable } from "./adminTypes";
import { RecordEditor } from "./RecordEditor";
import { ReservationTable } from "./ReservationTable";
import type { Writes } from "./useAdminWrites";
import { useReservationActions, type DatesEdit } from "./useReservationActions";
import { NO_FILTERS, useReservations, type Filters } from "./useReservations";

type FiltersProps = {
  loading: boolean;
  onApply: (filters: Filters) => void;
  onRefresh: () => void;
};

function ReservationFilters({ loading, onApply, onRefresh }: FiltersProps) {
  const [draft, setDraft] = useState<Filters>(NO_FILTERS);

  function submit(event: FormEvent) {
    event.preventDefault();
    onApply(draft);
  }

  return (
    <Form className="admin-filters reservation-filters" onSubmit={submit}>
      <label className="reservation-search">
        Search reservations
        <input
          type="search"
          placeholder="Guest name, email or booking reference"
          value={draft.search}
          onChange={(event) => setDraft({ ...draft, search: event.target.value })}
        />
      </label>
      <Select
        className="reservation-status heroui-control"
        classNames={{ trigger: "reservation-status-trigger", label: "reservation-status-label", value: "reservation-status-value", popoverContent: "property-switcher-menu" }}
        label="Status"
        labelPlacement="outside"
        selectedKeys={[draft.status || "all"]}
        disallowEmptySelection
        onSelectionChange={(keys) => {
          if (keys === "all") return;
          const key = [...keys][0];
          if (key != null) setDraft({ ...draft, status: key === "all" ? "" : String(key) });
        }}
        listboxProps={{ classNames: { base: "property-menu-wrapper", list: "property-menu-list" }, itemClasses: { base: "property-switcher-option" } }}
        popoverProps={{ offset: 8 }}
      >
        {["all", ...BOOKING_STATUSES].map((status) => {
          const title = status === "all" ? "All statuses" : readable(status).replace(/^./, (letter) => letter.toUpperCase());
          return <SelectItem key={status} textValue={title}>{title}</SelectItem>;
        })}
      </Select>
      <button className="button" disabled={loading}>
        Apply filters
      </button>
      <button type="button" className="reservation-refresh" disabled={loading} onClick={onRefresh}>
        Refresh
      </button>
    </Form>
  );
}

type PagerProps = {
  page: number;
  loading: boolean;
  hasNext: boolean;
  onPage: (page: number) => void;
};

function Pager({ page, loading, hasNext, onPage }: PagerProps) {
  return (
    <nav className="table-pagination reservation-pagination" aria-label="Reservation pages">
      <button disabled={loading || page === 0} onClick={() => onPage(page - 1)}>
        Previous page
      </button>
      <span aria-live="polite">Page {page + 1}</span>
      <button disabled={loading || !hasNext} onClick={() => onPage(page + 1)}>
        Next page
      </button>
    </nav>
  );
}

type EditorProps = {
  edit: DatesEdit;
  busy: boolean;
  onChange: (edit: DatesEdit) => void;
  onSave: () => void;
  onDiscard: () => void;
};

function DatesEditor({ edit, busy, onChange, onSave, onDiscard }: EditorProps) {
  return (
    <RecordEditor value={edit}
      title={`Change dates · ${edit.reference}`}
      busy={busy}
      onSubmit={onSave}
      onDiscard={onDiscard}
    >
      <label>
        Check in
        <input
          type="date"
          required
          value={edit.checkIn}
          onChange={(event) => onChange({ ...edit, checkIn: event.target.value })}
        />
      </label>
      <label>
        Check out
        <input
          type="date"
          required
          min={edit.checkIn}
          value={edit.checkOut}
          onChange={(event) => onChange({ ...edit, checkOut: event.target.value })}
        />
      </label>
    </RecordEditor>
  );
}

type Props = { branchId: string; writes: Writes };

export function ReservationsPanel({ branchId, writes }: Props) {
  const { confirmLeave } = useNavigationGuard();
  const list = useReservations(branchId);
  const actions = useReservationActions(branchId, list.reload, writes);

  return (
    <div className="admin-panel">
      <h2>Reservations</h2>
      {actions.edit && (
        <DatesEditor
          key={actions.edit.reference}
          edit={actions.edit}
          busy={writes.busy}
          onChange={actions.setEdit}
          onSave={() => void actions.saveDates()}
          onDiscard={() => actions.setEdit(null)}
        />
      )}
      <ReservationFilters
        loading={list.loading}
        onApply={list.applyFilters}
        onRefresh={() => void list.reload()}
      />
      {list.loading && <p role="status">Loading reservations…</p>}
      {list.error && (
        <p className="form-error" role="alert">
          {list.error} Use Refresh to try again.
        </p>
      )}
      {!list.loading && !list.error && !list.bookings.length && (
        <p>No reservations match this branch and these filters.</p>
      )}
      {!list.loading && list.bookings.length > 0 && (
        <ReservationTable
          bookings={list.bookings}
          actions={{
            onApprove: actions.approve,
            onCancel: actions.cancel,
            onModify: async ({ reference, checkIn, checkOut }) => {
              if (await confirmLeave()) actions.setEdit({ reference, checkIn, checkOut });
            },
          }}
        />
      )}
      <Pager page={list.page} loading={list.loading} hasNext={list.hasNext} onPage={list.goToPage} />
    </div>
  );
}