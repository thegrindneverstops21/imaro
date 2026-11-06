import { useState, type FormEvent } from "react";
import type { AdminRoom, RoomTypeOption } from "./adminTypes";
import { RecordEditor } from "./RecordEditor";
import { RoomTypeIdField } from "./RoomTypeIdField";
import type { Writes } from "./useAdminWrites";
import type { BranchInventory } from "./useBranchInventory";
import { useRoomActions, type NewRoom, type RoomEdit } from "./useRoomActions";

const BLANK_ROOM: NewRoom = { roomTypeId: "", roomNumber: "" };

type AddProps = {
  types: RoomTypeOption[];
  busy: boolean;
  onAdd: (room: NewRoom) => Promise<boolean>;
};

function AddRoomForm({ types, busy, onAdd }: AddProps) {
  const [room, setRoom] = useState(BLANK_ROOM);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await onAdd(room)) setRoom(BLANK_ROOM);
  }

  return (
    <form className="admin-inline-form" onSubmit={(event) => void submit(event)}>
      <RoomTypeIdField
        types={types}
        value={room.roomTypeId}
        onChange={(roomTypeId) => setRoom({ ...room, roomTypeId })}
      />
      <label>
        Room number
        <input
          required
          maxLength={40}
          value={room.roomNumber}
          onChange={(event) => setRoom({ ...room, roomNumber: event.target.value })}
        />
      </label>
      <button className="button" disabled={busy}>
        Add room
      </button>
    </form>
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
    <RecordEditor title={`Edit room ${edit.roomNumber}`} busy={busy} onSubmit={onSave} onDiscard={onDiscard}>
      <label>
        Room number
        <input
          required
          maxLength={40}
          value={edit.roomNumber}
          onChange={(event) => onChange({ ...edit, roomNumber: event.target.value })}
        />
      </label>
      <label>
        Room type
        <select
          required
          value={edit.roomTypeId}
          onChange={(event) => onChange({ ...edit, roomTypeId: event.target.value })}
        >
          {types.map((type) => (
            <option key={type.roomTypeId} value={type.roomTypeId}>
              {type.name}
            </option>
          ))}
        </select>
      </label>
    </RecordEditor>
  );
}

type TableProps = {
  rooms: AdminRoom[];
  onEdit: (room: AdminRoom) => void;
  onRetire: (room: AdminRoom) => void;
};

function RoomTable({ rooms, onEdit, onRetire }: TableProps) {
  return (
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
          {rooms.map((room) => (
            <tr key={room.id}>
              <td>{room.roomNumber}</td>
              <td>{room.roomType}</td>
              <td>{room.status}</td>
              <td>
                {room.status === "active" && (
                  <>
                    <button aria-label={`Edit room ${room.roomNumber}`} onClick={() => onEdit(room)}>
                      Edit
                    </button>
                    <button
                      aria-label={`Set room ${room.roomNumber} to maintenance`}
                      onClick={() => onRetire(room)}
                    >
                      Set maintenance
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Props = { branchId: string; inventory: BranchInventory; writes: Writes };

export function RoomsPanel({ branchId, inventory, writes }: Props) {
  const actions = useRoomActions(branchId, inventory.reload, writes);

  return (
    <div className="admin-panel">
      <h2>Room inventory</h2>
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
      <AddRoomForm types={inventory.types} busy={writes.busy} onAdd={actions.add} />
      <RoomTable
        rooms={inventory.rooms}
        onEdit={({ id, roomNumber, roomTypeId }) =>
          actions.setEdit({ id, roomNumber, roomTypeId: String(roomTypeId) })
        }
        onRetire={(room) => void actions.retire(room)}
      />
    </div>
  );
}