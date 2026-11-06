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
    <form className="admin-filters" onSubmit={submit}>
      <label>
        Guest, email or reference
        <input
          value={draft.search}
          onChange={(event) => setDraft({ ...draft, search: event.target.value })}
        />
      </label>
      <label>
        Reservation status
        <select
          value={draft.status}
          onChange={(event) => setDraft({ ...draft, status: event.target.value })}
        >
          <option value="">All statuses</option>
          {BOOKING_STATUSES.map((status) => (
            <option key={status} value={status}>
              {readable(status)}
            </option>
          ))}
        </select>
      </label>
      <button className="button" disabled={loading}>
        Apply filters
      </button>
      <button type="button" className="text-button" onClick={onRefresh}>
        Refresh
      </button>
    </form>
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
    <div className="table-pagination">
      <button disabled={loading || page === 0} onClick={() => onPage(page - 1)}>
        Previous page
      </button>
      <span>Page {page + 1}</span>
      <button disabled={loading || !hasNext} onClick={() => onPage(page + 1)}>
        Next page
      </button>
    </div>
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
    <RecordEditor
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
            onModify: ({ reference, checkIn, checkOut }) =>
              actions.setEdit({ reference, checkIn, checkOut }),
          }}
        />
      )}
      <Pager page={list.page} loading={list.loading} hasNext={list.hasNext} onPage={list.goToPage} />
    </div>
  );
}