import { rows } from "../db/pool";
import type { SessionUser } from "../domain/authTypes";
import type { ProfilePatch } from "../validation/account";
import * as sql from "./accountQueries";

export interface Profile extends SessionUser {
  phone: string | null;
}
export interface BranchSocial {
  slug: string;
  ratingAverage: number;
  reviewCount: number;
  isFavourite: boolean;
}
export const findProfile = async (id: number) =>
  (await rows<Profile>(sql.PROFILE, [id]))[0];
export async function updateProfile(id: number, patch: ProfilePatch) {
  const values = [
    id, patch.name, patch.phone,
  ];
  return (await rows<Profile>(sql.UPDATE_PROFILE, values))[0];
}
export const myBookings = (id: number) =>
  rows<{ reference: string }>(sql.MY_BOOKINGS, [id]);
export const favourites = (id: number) => rows(sql.FAVOURITES, [id]);
export const saveFavourite = (userId: number, branchId: number) =>
  rows(sql.SAVE_FAVOURITE, [userId, branchId]);
export const deleteFavourite = (userId: number, slug: string) =>
  rows(sql.DELETE_FAVOURITE, [userId, slug]);
export const branchSocial = (slugs: string[], userId: number | null) =>
  rows<BranchSocial>(sql.BRANCH_SOCIAL, [slugs, userId]);
