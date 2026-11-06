import { rows } from "../db/pool";
import type {
  BranchFilters,
  BranchRow,
  BranchSummaryRow,
  ImageRow,
  NamedIconRow,
  PolicyRow,
  RoomTypeAmenityRow,
  RoomTypeAvailabilityRow,
  RoomTypeImageRow,
  Stay,
} from "../domain/types";
import {
  BRANCH_AMENITIES,
  BRANCH_BY_SLUG,
  BRANCH_IMAGES,
  BRANCH_POLICIES,
  ROOM_TYPE_AMENITIES,
  ROOM_TYPE_IMAGES,
  ROOM_TYPES_FOR_BRANCH,
  SEARCH_BRANCHES,
} from "./branchQueries";

// Database access only: no business rules live here.

export async function findPublishedBranch(
  slug: string,
): Promise<BranchRow | null> {
  const [branch] = await rows<BranchRow>(BRANCH_BY_SLUG, [slug]);
  return branch ?? null;
}

export const findBranchImages = (branchId: number) =>
  rows<ImageRow>(BRANCH_IMAGES, [branchId]);

export const findBranchAmenities = (branchId: number) =>
  rows<NamedIconRow>(BRANCH_AMENITIES, [branchId]);

export const findBranchPolicies = (branchId: number) =>
  rows<PolicyRow>(BRANCH_POLICIES, [branchId]);

export const findRoomTypeAvailability = (branchId: number, stay: Stay) =>
  rows<RoomTypeAvailabilityRow>(ROOM_TYPES_FOR_BRANCH, [
    stay.checkIn ?? null,
    stay.checkOut ?? null,
    branchId,
  ]);

export const findRoomTypeImages = (roomTypeIds: number[]) =>
  rows<RoomTypeImageRow>(ROOM_TYPE_IMAGES, [roomTypeIds]);

export const findRoomTypeAmenities = (roomTypeIds: number[]) =>
  rows<RoomTypeAmenityRow>(ROOM_TYPE_AMENITIES, [roomTypeIds]);

function toSearchParams(filters: BranchFilters): unknown[] {
  return [
    filters.checkIn ?? null,
    filters.checkOut ?? null,
    filters.guests,
    filters.rooms,
    filters.roomType ?? null,
    filters.minPrice ?? null,
    filters.maxPrice ?? null,
    filters.city ?? null,
  ];
}

export const searchBranches = (filters: BranchFilters) =>
  rows<BranchSummaryRow>(SEARCH_BRANCHES, toSearchParams(filters));
