import { Router } from "express";
import { requireUser, currentSession } from "../middleware/auth";
import * as account from "../services/accountService";
import * as notifications from "../services/notificationService";
import { profilePatch, notificationId } from "../validation/account";

export const meRouter = Router();
meRouter.use(requireUser);
meRouter.get("/", async (_req, res) =>
  res.json({ data: await account.getProfile(currentSession(res).userId) }),
);
meRouter.patch("/", async (req, res) => {
  res.json({
    data: await account.updateProfile(
      currentSession(res).userId,
      profilePatch.parse(req.body),
    ),
  });
});
meRouter.get("/bookings", async (_req, res) =>
  res.json({ data: await account.myBookings(currentSession(res).userId) }),
);
meRouter.get("/favourites", async (_req, res) =>
  res.json({ data: await account.favourites(currentSession(res).userId) }),
);
meRouter.put("/favourites/:branchSlug", async (req, res) => {
  res.json({
    data: await account.saveFavourite(
      currentSession(res).userId,
      req.params.branchSlug,
    ),
  });
});
meRouter.delete("/favourites/:branchSlug", async (req, res) => {
  res.json({
    data: await account.deleteFavourite(
      currentSession(res).userId,
      req.params.branchSlug,
    ),
  });
});
meRouter.get("/notifications", async (_req, res) => {
  res.json({
    data: await notifications.listNotifications(currentSession(res).userId),
  });
});
meRouter.patch("/notifications/:id/read", async (req, res) => {
  res.json({
    data: await notifications.readNotification(
      currentSession(res).userId,
      notificationId.parse(req.params.id),
    ),
  });
});
