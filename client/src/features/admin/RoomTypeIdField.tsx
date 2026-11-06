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
      Room type ID
      <input
        list={listId}
        type="number"
        required
        min="1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={listId}>
        {types.map((type) => (
          <option key={type.roomTypeId} value={type.roomTypeId} label={type.name} />
        ))}
      </datalist>
      <small>{match ? match.name : "Use a listed type or enter a known room type ID."}</small>
    </label>
  );
}