import { raw, Router } from "express";
import { saveUploadedImage } from "../services/imageUploadService";
import { HttpStatus } from "../constants/http";
import { requireAdmin } from "../middleware/auth";
import * as admin from "../services/adminService";
import {
  reservationFilters,
  adminId,
  bookingUpdate,
  branchCreateInput,
  branchPatch,
  priceInput,
  roomInput,
  roomPatch,
} from "../validation/admin";

export const adminRouter = Router();
adminRouter.use(requireAdmin); // applies to everything below

adminRouter.post("/uploads", raw({ type: "application/octet-stream", limit: "5mb" }), async (req, res) => {
  res.status(HttpStatus.Created).json({ data: await saveUploadedImage(req.body) });
});

//Branches
adminRouter.get("/branches", async (_req, res) =>
  res.json({ data: await admin.listBranches() }),
);
adminRouter.post("/branches", async (req, res) =>
  res
    .status(HttpStatus.Created)
    .json({ data: await admin.createBranch(branchCreateInput.parse(req.body)) }),
);
adminRouter.get("/room-types", async (_req, res) =>
  res.json({ data: await admin.listRoomTypes() }),
);
adminRouter.patch("/branches/:id", async (req, res) =>
  res.json({
    data: await admin.updateBranch(
      adminId.parse(req.params.id),
      branchPatch.parse(req.body),
    ),
  }),
);
// Branch deletion is a soft hide, preserving historical bookings and room records.
adminRouter.delete("/branches/:id", async (req, res) =>
  res.json({ data: await admin.unpublishBranch(adminId.parse(req.params.id)) }),
);

// Physical rooms
adminRouter.get("/branches/:branchId/rooms", async (req, res) =>
  res.json({ data: await admin.listRooms(adminId.parse(req.params.branchId)) }),
);
adminRouter.post("/branches/:branchId/rooms", async (req, res) =>
  res.status(HttpStatus.Created).json({
    data: await admin.createRoom(
      adminId.parse(req.params.branchId),
      roomInput.parse(req.body),
    ),
  }),
);
adminRouter.patch("/rooms/:id", async (req, res) =>
  res.json({
    data: await admin.updateRoom(
      adminId.parse(req.params.id),
      roomPatch.parse(req.body),
    ),
  }),
);
// Rooms are retired to maintenance instead of physically deleted, preserving booking history.
adminRouter.delete("/rooms/:id", async (req, res) =>
  res.json({
    data: await admin.setRoomMaintenance(adminId.parse(req.params.id)),
  }),
);

// Prices per room type
adminRouter.get("/branches/:branchId/prices", async (req, res) =>
  res.json({
    data: await admin.listPrices(adminId.parse(req.params.branchId)),
  }),
);
adminRouter.put("/branches/:branchId/prices/:roomTypeId", async (req, res) => {
  const { pricePerNight } = priceInput.parse(req.body);
  res.json({
    data: await admin.setPrice(
      adminId.parse(req.params.branchId),
      adminId.parse(req.params.roomTypeId),
      pricePerNight,
    ),
  });
});
adminRouter.delete("/branches/:branchId/prices/:roomTypeId", async (req, res) =>
  res.json({
    data: await admin.removePrice(
      adminId.parse(req.params.branchId),
      adminId.parse(req.params.roomTypeId),
    ),
  }),
);

// Reservations
adminRouter.get("/bookings", async (req, res) => {
  const filters = reservationFilters.parse(req.query);
  res.json(await admin.listReservations(filters));
});
adminRouter.get("/bookings/:reference", async (req, res) =>
  res.json({ data: await admin.getReservation(req.params.reference) }),
);

adminRouter.post("/bookings/:reference/approve", async (req, res) =>
  res.json({ data: await admin.approveReservation(req.params.reference) }),
);
adminRouter.patch("/bookings/:reference", async (req, res) =>
  res.json({
    data: await admin.modifyReservation(
      req.params.reference,
      bookingUpdate.parse(req.body),
    ),
  }),
);
adminRouter.post("/bookings/:reference/cancel", async (req, res) =>
  res.json({ data: await admin.cancelReservation(req.params.reference) }),
);
