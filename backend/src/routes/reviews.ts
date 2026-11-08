import { Router } from "express";
import { readSession } from "../auth/session";
import { currentSession, requireUser } from "../middleware/auth";
import {
  listAllReviews,
  toggleReaction,
} from "../services/reviewService";
import { pageQuery, reviewId } from "../validation/account";

export const reviewsRouter = Router();

reviewsRouter.get("/", async (req, res) => {
  res.json(
    await listAllReviews(
      pageQuery.parse(req.query),
      readSession(req)?.userId ?? null,
    ),
  );
});

// Reacting ("helpful") is per signed-in user; the same call toggles it off.
reviewsRouter.post("/:id/reactions", requireUser, async (req, res) => {
  res.json({
    data: await toggleReaction(
      reviewId.parse(req.params.id),
      currentSession(res).userId,
    ),
  });
});
