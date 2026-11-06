/**
 * BOOKING ROUTES  (/api/v1/bookings)
 *
 * POST /                    - create a booking (guest or signed in)
 * GET  /:reference          - view a booking
 * POST /:reference/cancel   - cancel a booking
 * POST /:reference/payment  - start a PayFast payment
 * POST /:reference/payment/simulate - dev-only fake payment
 * POST /:reference/review   - review a completed stay
 *
 * "Access" to one booking = the manage token from the confirmation email OR
 * being the signed-in user who made it. See accessFrom below.
 */
import { Router, type Request } from "express";
import { readSession } from "../auth/session";
import { BOOKING_TOKEN_HEADER } from "../constants/domain";
import { HttpStatus } from "../constants/http";
import type { BookingAccess } from "../domain/bookingTypes";
import * as bookingService from "../services/bookingService";
import { createBookingBody } from "../validation/booking";
import { createPayment } from "../services/paymentService";
import { createReview } from "../services/reviewService";
import { reviewBody } from "../validation/account";

export const bookingsRouter = Router();

bookingsRouter.post("/:reference/review", async (req, res) => {
  res.status(HttpStatus.Created).json({ data: await createReview(req.params.reference, accessFrom(req), reviewBody.parse(req.body)) });
});

bookingsRouter.post("/:reference/payment", async (req, res) => {
  res.json({ data: await createPayment(req.params.reference, accessFrom(req)) });
});

// Collects "who is asking?" for every booking route: the token (if any) and the
// signed-in user id (if any). The service decides whether that is enough.
// The manage token travels in a header, never in the URL, so it stays out of logs.
const accessFrom = (req: Request): BookingAccess => ({
  token: req.header(BOOKING_TOKEN_HEADER),
  userId: readSession(req)?.userId ?? null,
});

bookingsRouter.post("/", async (req, res) => {
  const input = createBookingBody.parse(req.body);
  const created = await bookingService.createBooking(
    input,
    readSession(req)?.userId ?? null,
  );
  res.status(HttpStatus.Created).json({ data: created });
});

bookingsRouter.get("/:reference", async (req, res) => {
  res.json({
    data: await bookingService.getBooking(
      req.params.reference,
      accessFrom(req),
    ),
  });
});

bookingsRouter.post("/:reference/cancel", async (req, res) => {
  res.json({
    data: await bookingService.cancelBooking(
      req.params.reference,
      accessFrom(req),
    ),
  });
});

bookingsRouter.post("/:reference/payment/simulate", async (req, res) => {
  res.json({
    data: await bookingService.simulatePayment(
      req.params.reference,
      accessFrom(req),
    ),
  });
});
