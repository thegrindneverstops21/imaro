import { REVIEW_UNAVAILABLE } from "../constants/account";
import { HttpStatus } from "../constants/http";
import { ErrorMessage } from "../constants/messages";
import { withTransaction } from "../db/transaction";
import type { BookingAccess } from "../domain/bookingTypes";
import { canReview } from "../domain/reviewRules";
import { todayIso } from "../domain/rules";
import { AppError } from "../middleware/error";
import { findPublishedBranch } from "../repositories/branchRepository";
import { findBookingForUpdate } from "../repositories/bookingRepository";
import * as repo from "../repositories/reviewRepository";
import { requireAccessible } from "./bookingService";
import type { Page, ReviewInput } from "../validation/account";

export async function createReview(
  reference: string,
  access: BookingAccess,
  input: ReviewInput,
) {
  return withTransaction(async (db) => {
    const booking = await requireAccessible(
      () => findBookingForUpdate(db, reference),
      access,
    );
    if (!canReview(booking, todayIso()))
      throw new AppError(HttpStatus.Conflict, REVIEW_UNAVAILABLE);
    return repo.insertReview(db, booking.id, input);
  });
}
export async function listReviews(slug: string, page: Page) {
  const branch = await findPublishedBranch(slug);
  if (!branch)
    throw new AppError(HttpStatus.NotFound, ErrorMessage.BranchNotFound);
  const { data, total } = await repo.listReviews(branch.id, page);
  return { data, meta: { total, ...page } };
}
