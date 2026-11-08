import type { RoomTypeOption } from "./adminTypes";

type Props = {
  types: RoomTypeOption[];
  value: string;
  onChange: (value: string) => void;
};

export function RoomTypeIdField({ types, value, onChange }: Props) {
  const match = types.find((type) => String(type.roomTypeId) === value);
  return <label className="room-type-field">
    Room type
    <select required value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Choose a room type</option>
      {types.map((type) => <option key={type.roomTypeId} value={type.roomTypeId}>
        {type.name}{type.capacity ? ` · Up to ${type.capacity} guests` : ""}
      </option>)}
    </select>
    <small>{match?.capacity ? `Capacity: ${match.capacity} guests per room.` : types.length ? "Choose the category for this room or rate." : "No room types are available. Ask your administrator to configure the room-type catalogue."}</small>
  </label>;
}
