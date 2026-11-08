import { useDraftGuard, useNavigationGuard } from "../../components/ui/NavigationGuard";
import { Form } from "../../components/ui/Form";
import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "../../components/ui";
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
  useDraftGuard(input);
  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <Form className="form-grid admin-modal-form" onSubmit={submit}>
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
          placeholder="Enter nightly rate"
          value={input.pricePerNight}
          onChange={(event) => onChange({ ...input, pricePerNight: event.target.value })}
        />
      </label>
      <button className="button span-two" disabled={busy}>
        Save rate
      </button>
    </Form>
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
  const { confirmLeave } = useNavigationGuard();
  const close = async () => { if (!writes.busy && await confirmLeave()) setOpen(false); };
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(BLANK_RATE);
  const priceField = useRef<HTMLInputElement>(null);
  const { save, remove } = useRateActions(branchId, inventory.reload, writes);

  useEffect(() => { if (open && input.roomTypeId) priceField.current?.focus(); }, [open, input.roomTypeId]);

  function edit(price: Price) {
    setInput({ roomTypeId: String(price.roomTypeId), pricePerNight: String(price.pricePerNight) });
    setOpen(true);
  }

  async function submitRate() {
    if (await save(input)) setOpen(false);
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <h2>Nightly rates</h2>
        <button
          className="button"
          type="button"
          onClick={() => {
            setInput(BLANK_RATE);
            setOpen(true);
          }}
        >
          Add rate
        </button>
      </div>
      {inventory.loading && <p role="status">Loading nightly rates…</p>}
      <Modal
        isDismissable={false}
        isOpen={open}
        onOpenChange={(open) => { if (!open) void close(); }}
        placement="center" scrollBehavior="inside" classNames={{ base: "admin-modal" }}
        size="lg"
        shouldCloseOnInteractOutside={(element) =>
          !element.closest(".modern-select-list, .modern-calendar")
        }
      >
        <ModalContent>
          <ModalHeader>
            <div>
              <h2>Nightly rate</h2>
              <p>Set the price guests pay per night, VAT included.</p>
            </div>
          </ModalHeader>
          <ModalBody className="admin-modal-body">
            <RateForm
              input={input}
              types={inventory.types}
              busy={writes.busy}
              priceRef={priceField}
              onChange={setInput}
              onSubmit={() => void submitRate()}
            />
          </ModalBody>
          <ModalFooter>
            <button type="button" className="button button-quiet" onClick={() => void close()}>
              Cancel
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <RateTable prices={inventory.prices} onEdit={edit} onRemove={(price) => void remove(price)} />
    </div>
  );
}