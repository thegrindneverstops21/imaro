import { Router } from "express";
import { rows } from "../db/pool";
import { branchesRouter } from "./branches";

export const router = Router();

router.get("/health", async (_req, res) => {
  await rows("SELECT 1");
  res.json({ status: "ok" });
});

router.use("/branches", branchesRouter);
