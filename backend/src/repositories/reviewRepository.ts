import { rows, type Queryable } from "../db/pool";
import type { Page, ReviewInput } from "../validation/account";
import * as sql from "./reviewQueries";

export const insertReview = async (
  db: Queryable,
  bookingId: number,
  input: ReviewInput,
) =>
  (
    await rows(
      sql.INSERT_REVIEW,
      [bookingId, input.rating, input.comment ?? null],
      db,
    )
  )[0];
export const listReviews = async (branchId: number, page: Page) =>
  (
    await rows<{ data: unknown[]; total: number }>(sql.LIST_REVIEWS, [
      branchId,
      page.limit,
      page.offset,
    ])
  )[0]!;

export const listAllReviews = async (page: Page, userId: number | null) =>
  (
    await rows<{ data: unknown[]; total: number; ratingAverage: number | null }>(
      sql.LIST_ALL_REVIEWS,
      [page.limit, page.offset, userId],
    )
  )[0]!;

export const reviewExists = async (db: Queryable, reviewId: number) =>
  (await rows(sql.REVIEW_EXISTS, [reviewId], db)).length > 0;

// Adds the reaction when absent, removes it when present, then reports the new state.
export const toggleReaction = async (
  db: Queryable,
  reviewId: number,
  userId: number,
) => {
  const inserted = await rows<{ review_id: number }>(
    sql.ADD_REACTION,
    [reviewId, userId],
    db,
  );
  if (!inserted.length)
    await rows(sql.REMOVE_REACTION, [reviewId, userId], db);
  const count =
    (await rows<{ count: number }>(sql.REACTION_COUNT, [reviewId], db))[0]
      ?.count ?? 0;
  return { reacted: inserted.length > 0, helpfulCount: count };
};
