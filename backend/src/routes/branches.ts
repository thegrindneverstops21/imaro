import { Router } from "express";
import { HttpStatus } from "../constants/http";
import { ErrorMessage } from "../constants/messages";
import { AppError } from "../middleware/error";
import * as branchService from "../services/branchService";
import { readSession } from "../auth/session";
import { listReviews } from "../services/reviewService";
import { pageQuery } from "../validation/account";
import {
  availabilityQuery,
  branchSearchQuery,
  stayQuery,
} from "../validation/stay";
import { availabilityNotificationBody } from "../validation/availabilityNotification";
import * as availabilityNotifications from "../repositories/availabilityNotificationRepository";

export const branchesRouter = Router();

// Small guard: a missing branch becomes a clean 404 instead of a null response.
function orNotFound<T>(value: T | null): T {
  if (value === null)
    throw new AppError(HttpStatus.NotFound, ErrorMessage.BranchNotFound);
  return value;
}

branchesRouter.get("/", async (req, res) => {
  const filters = branchSearchQuery.parse(req.query);
  res.json({
    data: await branchService.searchBranches(
      filters,
      readSession(req)?.userId ?? null,
    ),
  });
});

branchesRouter.get("/:slug/reviews", async (req, res) => {
  res.json(await listReviews(req.params.slug, pageQuery.parse(req.query)));
});

branchesRouter.post("/:slug/availability-notifications", async (req, res) => {
  const { email } = availabilityNotificationBody.parse(req.body);
  const subscribed = await availabilityNotifications.subscribe(req.params.slug, email);
  res.status(HttpStatus.Created).json({
    data: {
      subscribed,
      message: "You’ll be notified when this property has rooms available.",
    },
  });
});

branchesRouter.get("/:slug", async (req, res) => {
  const stay = stayQuery.parse(req.query);
  const branch = await branchService.getBranchDetail(
    req.params.slug,
    stay,
    readSession(req)?.userId ?? null,
  );
  res.json({ data: orNotFound(branch) });
});

branchesRouter.get("/:slug/availability", async (req, res) => {
  const stay = availabilityQuery.parse(req.query);
  const availability = await branchService.getAvailability(
    req.params.slug,
    stay,
  );
  res.json({ data: orNotFound(availability) });
});
 