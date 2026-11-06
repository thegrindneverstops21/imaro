import { Router } from "express";
import { rows } from "../db/pool";
import { branchesRouter } from "./branches";
import { bookingsRouter } from "./bookings";
import { authRouter } from "./auth";
import { adminRouter } from "./admin";
import { meRouter } from "./me";

export const router = Router();

// A health check: if this answers, the server is up and the database reachable.
router.get("/health", async (_req, res) => {
  await rows("SELECT 1");
  res.json({ status: "ok" });
});

router.use("/branches", branchesRouter);
router.use("/bookings", bookingsRouter);
router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/me", meRouter);
