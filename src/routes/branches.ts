import { Router } from "express";
import { HttpStatus } from "../constants/http";
import { ErrorMessage } from "../constants/messages";
import { AppError } from "../middleware/error";
import * as branchService from "../services/branchService";
import {
  availabilityQuery,
  branchSearchQuery,
  stayQuery,
} from "../validation/stay";

export const branchesRouter = Router();

function orNotFound<T>(value: T | null): T {
  if (value === null)
    throw new AppError(HttpStatus.NotFound, ErrorMessage.BranchNotFound);
  return value;
}

branchesRouter.get("/", async (req, res) => {
  const filters = branchSearchQuery.parse(req.query);
  res.json({ data: await branchService.searchBranches(filters) });
});

branchesRouter.get("/:slug", async (req, res) => {
  const stay = stayQuery.parse(req.query);
  const branch = await branchService.getBranchDetail(req.params.slug, stay);
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
