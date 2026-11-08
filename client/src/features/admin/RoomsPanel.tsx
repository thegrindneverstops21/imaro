import { useDraftGuard, useNavigationGuard } from "../../components/ui/NavigationGuard";
import { Form } from "../../components/ui/Form";
import { useState, type FormEvent } from "react";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "../../components/ui";
import { Icon } from "../../components/Icon";
import { ModernSelect } from "../../components/ui/ModernSelect";
import type { AdminRoom, RoomTypeOption } from "./adminTypes";
import { RecordEditor } from "./RecordEditor";
import { RoomTypeIdField } from "./RoomTypeIdField";
import type { Writes } from "./useAdminWrites";
import type { BranchInventory } from "./useBranchInventory";
import { useRoomActions, type NewRoom, type RoomEdit } from "./useRoomActions";

const BLANK_ROOM: NewRoom = { roomTypeId: "", roomNumber: "", status: "active" };

type AddProps = {
  types: RoomTypeOption[];
  busy: boolean;
  onAdd: (room: NewRoom) => Promise<boolean>;
};

function AddRoomForm({ types, busy, onAdd }: AddProps) {
  const [room, setRoom] = useState(BLANK_ROOM);
  useDraftGuard(room);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await onAdd(room)) setRoom(BLANK_ROOM);
  }

  return (
    <Form className="form-grid admin-modal-form" onSubmit={(event) => void submit(event)}>
      <RoomTypeIdField
        types={types}
        value={room.roomTypeId}
        onChange={(roomTypeId) => setRoom({ ...room, roomTypeId })}
      />
      <label>
        Room number
        <input
          required
          placeholder="Enter room number"
          maxLength={40}
          value={room.roomNumber}
          onChange={(event) => setRoom({ ...room, roomNumber: event.target.value })}
        />
      </label>
      <label>Availability
        <select value={room.status} onChange={(event) => setRoom({ ...room, status: event.target.value as "active" | "maintenance" })}>
          <option value="active">Active</option><option value="maintenance">Maintenance</option>
        </select>
        <small>Active rooms can be allocated when a nightly price is set. Maintenance rooms are unavailable.</small>
      </label>
      <button className="button span-two" disabled={busy || !types.length}>
        Add room
      </button>
    </Form>
  );
}

type EditorProps = {
  edit: RoomEdit;
  types: RoomTypeOption[];
  busy: boolean;
  onChange: (edit: RoomEdit) => void;
  onSave: () => void;
  onDiscard: () => void;
};

function RoomEditor({ edit, types, busy, onChange, onSave, onDiscard }: EditorProps) {
  return (
    <RecordEditor value={edit} title={`Edit room ${edit.roomNumber}`} busy={busy} onSubmit={onSave} onDiscard={onDiscard}>
      <label>
        Room number
        <input
          required
          placeholder="Enter room number"
          maxLength={40}
          value={edit.roomNumber}
          onChange={(event) => onChange({ ...edit, roomNumber: event.target.value })}
        />
      </label>
      <ModernSelect
        label="Room type"
        value={edit.roomTypeId}
        options={types.map((type) => ({ value: String(type.roomTypeId), label: type.name }))}
        onChange={(roomTypeId) => onChange({ ...edit, roomTypeId })}
      />
    </RecordEditor>
  );
}

type TableProps = {
  rooms: AdminRoom[];
  onEdit: (room: AdminRoom) => void;
  onRetire: (room: AdminRoom) => void;
  onReactivate: (room: AdminRoom) => void;
};

function RoomTable({ rooms, onEdit, onRetire, onReactivate }: TableProps) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const visible = term
    ? rooms.filter((room) =>
        [room.roomNumber, room.roomType, room.status].some((field) =>
          field.toLowerCase().includes(term),
        ),
      )
    : rooms;
  return (
    <>
      <label className="room-filter">
        Filter rooms
        <input
          type="search"
          placeholder="Room number, category or status"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Scrollable rooms table">
      <table>
        <thead>
          <tr>
            <th>Room</th>
            <th>Category</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {visible.map((room) => (
            <tr key={room.id}>
              <td>{room.roomNumber}</td>
              <td>{room.roomType}</td>
              <td>
                <span className={`reservation-badge ${room.status === "active" ? "success" : "pending"}`}>
                  {room.status === "active" ? "Active" : "Maintenance"}
                </span>
              </td>
              <td>
                <details className="row-menu">
                  <summary aria-label={`Actions for room ${room.roomNumber}`}>
                    <Icon name="moreVertical" />
                  </summary>
                  <div className="row-menu-list">
                    <button type="button" onClick={() => onEdit(room)}>
                      Edit
                    </button>
                    {room.status === "active" ? (
                      <button type="button" onClick={() => onRetire(room)}>
                        Set maintenance
                      </button>
                    ) : (
                      <button type="button" onClick={() => onReactivate(room)}>
                        Set active
                      </button>
                    )}
                  </div>
                </details>
              </td>
            </tr>
          ))}
          {!visible.length && (
            <tr>
              <td colSpan={4}>No rooms match this filter.</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </>
  );
}

type Props = { branchId: string; inventory: BranchInventory; writes: Writes };

export function RoomsPanel({ branchId, inventory, writes }: Props) {
  const { confirmLeave } = useNavigationGuard();
  const closeAdd = async () => { if (!writes.busy && await confirmLeave()) setAdding(false); };
  const actions = useRoomActions(branchId, inventory.reload, writes);
  const [adding, setAdding] = useState(false);

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <h2>Room inventory</h2>
        <button className="button" type="button" onClick={() => setAdding(true)}>
          Add room
        </button>
      </div>
      {inventory.loading && <p role="status">Loading room inventory…</p>}
      {actions.edit && (
        <RoomEditor
          key={actions.edit.id}
          edit={actions.edit}
          types={inventory.types}
          busy={writes.busy}
          onChange={actions.setEdit}
          onSave={() => void actions.saveEdit()}
          onDiscard={() => actions.setEdit(null)}
        />
      )}
      <Modal
        isDismissable={false}
        size="lg"
        isOpen={adding}
        onOpenChange={(open) => { if (!open) void closeAdd(); }}
        placement="center" scrollBehavior="inside" classNames={{ base: "admin-modal" }}
        shouldCloseOnInteractOutside={(element) =>
          !element.closest(".modern-select-list, .modern-calendar")
        }
      >
        <ModalContent>
          <ModalHeader>
            <div>
              <h2>Add room</h2>
              <p>Assign a physical room to a room type.</p>
            </div>
          </ModalHeader>
          <ModalBody className="admin-modal-body">
            <AddRoomForm
              key={String(adding)}
              types={inventory.types}
              busy={writes.busy}
              onAdd={async (room) => {
                const added = await actions.add(room);
                if (added) setAdding(false);
                return added;
              }}
            />
          </ModalBody>
          <ModalFooter>
            <button type="button" className="button button-quiet" onClick={() => void closeAdd()}>
              Cancel
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <RoomTable
        rooms={inventory.rooms}
        onEdit={async ({ id, roomNumber, roomTypeId }) => {
          if (await confirmLeave()) actions.setEdit({ id, roomNumber, roomTypeId: String(roomTypeId) });
        }}
        onRetire={(room) => void actions.retire(room)}
        onReactivate={(room) => void actions.reactivate(room)}
      />
    </div>
  );
}
