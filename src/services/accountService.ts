import { HttpStatus } from "../constants/http";
import { ErrorMessage } from "../constants/messages";
import { toBookingView } from "../domain/bookingView";
import { AppError } from "../middleware/error";
import * as repo from "../repositories/accountRepository";
import * as bookings from "../repositories/bookingRepository";
import { findPublishedBranch } from "../repositories/branchRepository";
import type { ProfilePatch } from "../validation/account";

export async function getProfile(id: number) {
  const user = await repo.findProfile(id);
  if (!user)
    throw new AppError(HttpStatus.Unauthorized, ErrorMessage.SignInRequired);
  return user;
}
export async function updateProfile(id: number, patch: ProfilePatch) {
  await getProfile(id);
  return repo.updateProfile(id, patch);
}
export async function myBookings(id: number) {
  await getProfile(id);
  const references = await repo.myBookings(id);
  const views = await Promise.all(
    references.map(async ({ reference }) => {
      const booking = await bookings.findBooking(reference);
      if (!booking) return null;
      return toBookingView(
        booking,
        await bookings.findRoomSummary(booking.id),
        new Date(),
      );
    }),
  );
  return views.filter((view) => view !== null);
}
export const favourites = (id: number) => repo.favourites(id);
export async function saveFavourite(id: number, slug: string) {
  await getProfile(id);
  const branch = await findPublishedBranch(slug);
  if (!branch)
    throw new AppError(HttpStatus.NotFound, ErrorMessage.BranchNotFound);
  await repo.saveFavourite(id, branch.id);
  return { slug, isFavourite: true };
}
export async function deleteFavourite(id: number, slug: string) {
  await repo.deleteFavourite(id, slug);
  return { slug, isFavourite: false };
}
// Adds review counts/averages and "is this one of my favourites?" to a list of branches in a single extra query rather than one query per branch.
export async function decorateBranches<T extends { slug: string }>(
  branches: T[],
  userId: number | null,
) {
  const social = await repo.branchSocial(
    branches.map((branch) => branch.slug),
    userId,
  );
  return branches.map((branch) => ({
    ...branch,
    ...social.find((item) => item.slug === branch.slug),
  }));
}
