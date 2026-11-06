import { groupBy } from "../domain/collection";
import { decorateBranches } from "./accountService";
import { nightsBetween } from "../domain/pricing";
import { toRoomTypeView } from "../domain/roomTypes";
import type {
  Availability,
  BranchDetail,
  BranchFilters,
  DatedStay,
  RoomTypeAmenityRow,
  RoomTypeAvailabilityRow,
  RoomTypeDetails,
  RoomTypeImageRow,
  RoomTypeView,
  Stay,
} from "../domain/types";
import * as repo from "../repositories/branchRepository";

export const searchBranches = async (
  filters: BranchFilters,
  userId: number | null = null,
) => decorateBranches(await repo.searchBranches(filters), userId);

function detailsFor(
  roomTypeId: number,
  images: Map<number, RoomTypeImageRow[]>,
  amenities: Map<number, RoomTypeAmenityRow[]>,
): RoomTypeDetails {
  return {
    images: (images.get(roomTypeId) ?? []).map(({ url, alt }) => ({
      url,
      alt,
    })),
    amenities: (amenities.get(roomTypeId) ?? []).map(({ name, icon }) => ({
      name,
      icon,
    })),
  };
}

// Loads every room type for a branch with photos, amenities, availability and (if dates were given) a price quote.
async function loadRoomTypes(
  branchId: number,
  stay: Stay,
): Promise<RoomTypeView[]> {
  const types: RoomTypeAvailabilityRow[] = await repo.findRoomTypeAvailability(
    branchId,
    stay,
  );
  if (types.length === 0) return [];

  const ids = types.map((type) => type.roomTypeId);
  // Promise.all runs the two queries at the same time instead of one after the other, which halves the wait.
  const [images, amenities] = await Promise.all([
    repo.findRoomTypeImages(ids),
    repo.findRoomTypeAmenities(ids),
  ]);
  const imagesByType = groupBy(images, (image) => image.roomTypeId);
  const amenitiesByType = groupBy(amenities, (amenity) => amenity.roomTypeId);

  return types.map((type) =>
    toRoomTypeView(
      type,
      detailsFor(type.roomTypeId, imagesByType, amenitiesByType),
      stay,
    ),
  );
}

export async function getBranchDetail(
  slug: string,
  stay: Stay,
  userId: number | null = null,
): Promise<BranchDetail | null> {
  const branch = await repo.findPublishedBranch(slug);
  if (!branch) return null;

  const [images, amenities, policies, roomTypes] = await Promise.all([
    repo.findBranchImages(branch.id),
    repo.findBranchAmenities(branch.id),
    repo.findBranchPolicies(branch.id),
    loadRoomTypes(branch.id, stay),
  ]);
  const [decorated] = await decorateBranches([branch], userId);
  return { ...branch, ...decorated, images, amenities, policies, roomTypes };
}

export async function getAvailability(
  slug: string,
  stay: DatedStay,
): Promise<Availability | null> {
  const branch = await repo.findPublishedBranch(slug);
  if (!branch) return null;

  return {
    branch: { slug: branch.slug, name: branch.name },
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    nights: nightsBetween(stay.checkIn, stay.checkOut),
    guests: stay.guests,
    rooms: stay.rooms,
    roomTypes: await loadRoomTypes(branch.id, stay),
  };
}
