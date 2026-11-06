import { describe, expect, it } from "vitest";
import { groupBy } from "../../src/domain/collection";
import {
  hasDates,
  roomsNeeded,
  toRoomTypeView,
} from "../../src/domain/roomTypes";
import type { RoomTypeAvailabilityRow, Stay } from "../../src/domain/types";

const classic: RoomTypeAvailabilityRow = {
  roomTypeId: 1,
  slug: "classic",
  name: "Classic Room",
  tag: null,
  description: "Quiet room",
  bed: "Queen bed",
  sizeM2: 28,
  capacity: 2,
  pricePerNight: 1250,
  availableRooms: 3,
};
const details = { images: [], amenities: [] };
const undated: Stay = { guests: 2, rooms: 1 };
const dated: Stay = {
  ...undated,
  checkIn: "2026-11-10",
  checkOut: "2026-11-12",
};

describe("roomsNeeded", () => {
  it("uses one room when guests fit", () => {
    expect(roomsNeeded(2, undated)).toBe(1);
  });

  it("adds rooms when guests exceed capacity", () => {
    expect(roomsNeeded(2, { guests: 5, rooms: 1 })).toBe(3);
  });

  it("honours an explicit rooms request", () => {
    expect(roomsNeeded(2, { guests: 1, rooms: 2 })).toBe(2);
  });
});

describe("toRoomTypeView", () => {
  it("leaves out pricing until dates are chosen", () => {
    const view = toRoomTypeView(classic, details, undated);
    expect(view.canBook).toBe(true);
    expect(view.totalPrice).toBeUndefined();
  });

  it("prices the stay once dates are chosen", () => {
    const view = toRoomTypeView(classic, details, dated);
    expect(view).toMatchObject({
      nights: 2,
      totalPrice: 2500,
      vatIncluded: 326.09,
      roomsNeeded: 1,
    });
  });

  it("cannot be booked when too few rooms are free", () => {
    const view = toRoomTypeView({ ...classic, availableRooms: 1 }, details, {
      ...dated,
      guests: 4,
    });
    expect(view).toMatchObject({
      roomsNeeded: 2,
      canBook: false,
      totalPrice: 5000,
    });
  });
});

describe("hasDates / groupBy", () => {
  it("detects whether both dates exist", () => {
    expect(hasDates(dated)).toBe(true);
    expect(hasDates({ ...undated, checkIn: "2026-11-10" })).toBe(false);
  });

  it("groups items by numeric key", () => {
    const groups = groupBy(
      [{ id: 1 }, { id: 2 }, { id: 1 }],
      (item) => item.id,
    );
    expect(groups.get(1)).toHaveLength(2);
    expect(groups.get(2)).toHaveLength(1);
  });
});
