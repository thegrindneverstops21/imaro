import { useId } from "react";
import type { RoomTypeOption } from "./adminTypes";

type Props = {
  types: RoomTypeOption[];
  value: string;
  onChange: (value: string) => void;
};

export function RoomTypeIdField({ types, value, onChange }: Props) {
  const listId = useId();
  const match = types.find((type) => String(type.roomTypeId) === value);
  return (
    <label>
      Room type
      {types.length > 0 ? <select required value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Choose a room type</option>
        {types.map((type) => <option key={type.roomTypeId} value={type.roomTypeId}>{type.name}</option>)}
      </select> : <input
        list={listId}
        type="number"
        required
        min="1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />}
      <datalist id={listId}>
        {types.map((type) => (
          <option key={type.roomTypeId} value={type.roomTypeId} label={type.name} />
        ))}
      </datalist>
      <small>{match ? match.name : types.length ? "Choose the category for this room." : "No categories are available for this property yet. Enter a known category ID to set up its first room or rate."}</small>
    </label>
  );
}