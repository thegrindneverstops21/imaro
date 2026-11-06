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
