import { createHash, randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { pool, rows } from "../db/pool";
import { HttpStatus } from "../constants/http";
import { AppError } from "../middleware/error";
import { readBearer, requireAdmin, type Session } from "../middleware/auth";
import { availabilityQuery } from "../validation/stay";

const MAX_GUESTS = 10;
const MAX_ROOMS = 5;
const MAX_NAME_LENGTH = 150;
const MAX_EMAIL_LENGTH = 254;
const MIN_PHONE_LENGTH = 5;
const MAX_PHONE_LENGTH = 40;
const MAX_REQUEST_LENGTH = 2000;
const TOKEN_BYTES = 32;
const REFERENCE_BYTES = 5;
const MILLISECONDS_PER_NIGHT = 86_400_000;
const HOLD_MINUTES = 15;
const MILLISECONDS_PER_MINUTE = 60_000;

export const bookingsRouter = Router();
const createSchema = z.object({
  branchSlug: z.string().trim().min(1), roomType: z.string().trim().min(1),
  checkIn: z.string(), checkOut: z.string(), guests: z.coerce.number().int().min(1).max(MAX_GUESTS),
  rooms: z.coerce.number().int().min(1).max(MAX_ROOMS).default(1),
  guestName: z.string().trim().min(1).max(MAX_NAME_LENGTH), guestEmail: z.string().trim().email().max(MAX_EMAIL_LENGTH),
  guestPhone: z.string().trim().min(MIN_PHONE_LENGTH).max(MAX_PHONE_LENGTH), specialRequests: z.string().max(MAX_REQUEST_LENGTH).optional(),
});
const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

// eslint-disable-next-line complexity, max-lines-per-function
bookingsRouter.post("/", async (req, res) => {
  const input = createSchema.parse(req.body);
  const dates = availabilityQuery.parse({ checkIn: input.checkIn, checkOut: input.checkOut, guests: input.guests, rooms: input.rooms });
  const session = readBearer(req);
  const client = await pool.connect();
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const reference = `IM-${randomBytes(REFERENCE_BYTES).toString("hex").toUpperCase()}`;
  try {
    await client.query("BEGIN");
    // Expired holds no longer reserve inventory.
    await client.query(`UPDATE booking_rooms br SET active = false FROM bookings b WHERE br.booking_id = b.id AND b.status = 'held' AND b.hold_expires_at <= now() AND br.active`);
    await client.query(`UPDATE bookings SET status = 'expired', updated_at = now() WHERE status = 'held' AND hold_expires_at <= now()`);
    const branch = await client.query<{ id: number }>("SELECT id FROM branches WHERE slug = $1 AND is_published", [input.branchSlug]);
    if (!branch.rowCount) throw new AppError(HttpStatus.NotFound, "Branch not found");
    const candidates = await client.query<{ room_id: number; price: number; capacity: number }>(
      `SELECT r.id AS room_id, brt.price_per_night::float8 AS price, rt.capacity
       FROM rooms r JOIN room_types rt ON rt.id = r.room_type_id
       JOIN branch_room_types brt ON brt.branch_id = r.branch_id AND brt.room_type_id = rt.id
       WHERE r.branch_id = $1 AND r.status = 'active' AND rt.slug = $2
         AND NOT EXISTS (SELECT 1 FROM booking_rooms old WHERE old.room_id = r.id AND old.active AND old.stay && daterange($3::date, $4::date, '[)'))
       ORDER BY r.room_number FOR UPDATE OF r`, [branch.rows[0]!.id, input.roomType, dates.checkIn, dates.checkOut],
    );
    const capacity = candidates.rows[0]?.capacity;
    const needed = Math.max(input.rooms, Math.ceil(input.guests / (capacity || 1)));
    if (!capacity || (candidates.rowCount ?? 0) < needed) throw new AppError(HttpStatus.Conflict, "Not enough rooms are available for these dates");
    const total = candidates.rows.slice(0, needed).reduce((sum, room) => sum + Number(room.price), 0) * (Date.parse(dates.checkOut) - Date.parse(dates.checkIn)) / MILLISECONDS_PER_NIGHT;
    const userId = session?.userId ?? null;
    const created = await client.query<{ id: number }>(
      `INSERT INTO bookings (reference, branch_id, user_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, special_requests, access_token_hash, total_amount, hold_expires_at)
       VALUES ($1,$2,$3,$4,lower($5),$6,$7,$8,$9,$10,$11,$12,now() + interval '${HOLD_MINUTES} minutes') RETURNING id`,
      [reference, branch.rows[0]!.id, userId, input.guestName, input.guestEmail, input.guestPhone, dates.checkIn, dates.checkOut, input.guests, input.specialRequests ?? null, hashToken(token), total],
    );
    for (const room of candidates.rows.slice(0, needed)) {
      await client.query(`INSERT INTO booking_rooms (booking_id, room_id, price_per_night, stay) VALUES ($1,$2,$3,daterange($4::date,$5::date,'[)'))`, [created.rows[0]!.id, room.room_id, room.price, dates.checkIn, dates.checkOut]);
    }
    await client.query("COMMIT");
    res.status(HttpStatus.Created).json({ data: { reference, manageToken: token, status: "held", paymentStatus: "unpaid", totalAmount: total, currency: "ZAR", holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * MILLISECONDS_PER_MINUTE).toISOString(), payment: { simulated: true, endpoint: `/api/v1/bookings/${reference}/payment/simulate` } } });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
});

function requireManageToken(reference: string, token: string | undefined): Promise<{ id: number; reference: string; guest_name: string; guest_email: string; check_in: string; check_out: string; guests: number; status: string; payment_status: string; total_amount: number; hold_expires_at: string | null }[]> {
  if (!token) throw new AppError(HttpStatus.Unauthorized, "Booking manage token required in x-booking-token header");
  return rows(`SELECT id, reference, guest_name, guest_email, check_in, check_out, guests, status, payment_status, total_amount, hold_expires_at FROM bookings WHERE reference = $1 AND access_token_hash = $2`, [reference, hashToken(token)]);
}

// Static admin route must precede the reference parameter route.
bookingsRouter.get("/admin/list", requireAdmin, async (_req, res) => {
  const session = res.locals.session as Session;
  const data = await rows("SELECT reference, guest_name AS \"guestName\", guest_email AS \"guestEmail\", status, payment_status AS \"paymentStatus\", total_amount AS \"totalAmount\" FROM bookings ORDER BY created_at DESC LIMIT 100");
  res.json({ data, admin: session.email });
});

bookingsRouter.get("/:reference", async (req, res) => {
  const [booking] = await requireManageToken(req.params.reference!, req.header("x-booking-token"));
  if (!booking) throw new AppError(HttpStatus.NotFound, "Booking not found");
  res.json({ data: booking });
});

bookingsRouter.post("/:reference/cancel", async (req, res) => {
  const [booking] = await requireManageToken(req.params.reference!, req.header("x-booking-token"));
  if (!booking) throw new AppError(HttpStatus.NotFound, "Booking not found");
  if (["cancelled", "expired"].includes(booking.status)) throw new AppError(HttpStatus.Conflict, "Booking is already cancelled or expired");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query("UPDATE bookings SET status='cancelled', updated_at=now() WHERE id=$1 AND status NOT IN ('cancelled','expired') RETURNING id", [booking.id]);
    if (!updated.rowCount) throw new AppError(HttpStatus.Conflict, "Booking is already cancelled or expired");
    await client.query("UPDATE booking_rooms SET active=false WHERE booking_id=$1", [booking.id]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  res.json({ data: { reference: booking.reference, status: "cancelled" } });
});

bookingsRouter.post("/:reference/payment/simulate", async (req, res) => {
  const [booking] = await requireManageToken(req.params.reference!, req.header("x-booking-token"));
  if (!booking) throw new AppError(HttpStatus.NotFound, "Booking not found");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query("UPDATE bookings SET payment_status='paid', status='confirmed', hold_expires_at=NULL, updated_at=now() WHERE id=$1 AND status='held' AND hold_expires_at > now() RETURNING id", [booking.id]);
    if (!updated.rowCount) throw new AppError(HttpStatus.Conflict, "Booking hold has expired or is no longer payable");
    await client.query("INSERT INTO payments (booking_id, provider, amount, status, raw_payload) VALUES ($1,'simulated',$2,'complete',$3)", [booking.id, booking.total_amount, JSON.stringify({ outcome: "success", simulated: true })]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  res.json({ data: { reference: booking.reference, status: "confirmed", paymentStatus: "paid", simulated: true } });
});
