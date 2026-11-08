import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { formatMoney } from "../../lib/format";
import type { Price, RoomTypeOption } from "./adminTypes";
import { RoomTypeIdField } from "./RoomTypeIdField";
import type { Writes } from "./useAdminWrites";
import type { BranchInventory } from "./useBranchInventory";
import { useRateActions, type RateInput } from "./useRateActions";

const BLANK_RATE: RateInput = { roomTypeId: "", pricePerNight: "" };
const MAX_RATE = 1_000_000;

type FormProps = {
  input: RateInput;
  types: RoomTypeOption[];
  busy: boolean;
  priceRef: RefObject<HTMLInputElement | null>;
  onChange: (input: RateInput) => void;
  onSubmit: () => void;
};

function RateForm({ input, types, busy, priceRef, onChange, onSubmit }: FormProps) {
  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="admin-inline-form" onSubmit={submit}>
      <RoomTypeIdField
        types={types}
        value={input.roomTypeId}
        onChange={(roomTypeId) => onChange({ ...input, roomTypeId })}
      />
      <label>
        Price per night (ZAR)
        <input
          ref={priceRef}
          type="number"
          required
          min="0"
          max={MAX_RATE}
          step="0.01"
          value={input.pricePerNight}
          onChange={(event) => onChange({ ...input, pricePerNight: event.target.value })}
        />
      </label>
      <button className="button" disabled={busy}>
        Save rate
      </button>
    </form>
  );
}

type TableProps = {
  prices: Price[];
  onEdit: (price: Price) => void;
  onRemove: (price: Price) => void;
};

function RateTable({ prices, onEdit, onRemove }: TableProps) {
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label="Scrollable rates table">
      <table>
        <thead>
          <tr>
            <th>Room type</th>
            <th>Rate / night</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {prices.map((price) => (
            <tr key={price.roomTypeId}>
              <td>{price.name}</td>
              <td>{formatMoney(price.pricePerNight)}</td>
              <td>
                <button aria-label={`Edit rate for ${price.name}`} onClick={() => onEdit(price)}>
                  Edit rate
                </button>
                <button aria-label={`Remove rate for ${price.name}`} onClick={() => onRemove(price)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Props = { branchId: string; inventory: BranchInventory; writes: Writes };

export function RatesPanel({ branchId, inventory, writes }: Props) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(BLANK_RATE);
  const priceField = useRef<HTMLInputElement>(null);
  const { save, remove } = useRateActions(branchId, inventory.reload, writes);

  useEffect(() => { if (editing) priceField.current?.focus(); }, [editing]);

  function edit(price: Price) {
    setEditing(true);
    setInput({ roomTypeId: String(price.roomTypeId), pricePerNight: String(price.pricePerNight) });
    priceField.current?.focus(); // the form sits above the table; move the user to it
  }

  return (
    <div className="admin-panel">
      <h2>Nightly rates</h2>
      {inventory.loading && <p role="status">Loading nightly rates…</p>}
      <details className="admin-create" open={editing} onToggle={(event) => setEditing(event.currentTarget.open)}>
      <summary>Add or edit rate</summary>
      <RateForm
        input={input}
        types={inventory.types}
        busy={writes.busy}
        priceRef={priceField}
        onChange={setInput}
        onSubmit={() => void save(input)}
      />
      </details>
      <RateTable prices={inventory.prices} onEdit={edit} onRemove={(price) => void remove(price)} />
    </div>
  );
}