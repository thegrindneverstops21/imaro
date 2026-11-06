import {
  BookingStatus,
  DATE_RANGE_BOUNDS,
  PaymentRecordStatus,
  PaymentStatus,
  RoomStatus,
} from "../constants/domain";

// Expired holds stop blocking rooms: mark them expired and free their rooms.
export const SWEEP_EXPIRED_HOLDS = `
  WITH expired AS (
    UPDATE bookings SET status = '${BookingStatus.Expired}', updated_at = now()
    WHERE status = '${BookingStatus.Held}' AND hold_expires_at <= now()
    RETURNING id
  )
  UPDATE booking_rooms SET active = false
  WHERE booking_id IN (SELECT id FROM expired)`;

export const ROOM_OFFER = `
  SELECT b.id AS "branchId", rt.id AS "roomTypeId",
         brt.price_per_night::float8 AS "pricePerNight", rt.capacity
  FROM branches b
  JOIN branch_room_types brt ON brt.branch_id = b.id
  JOIN room_types rt ON rt.id = brt.room_type_id
  WHERE b.slug = $1 AND rt.slug = $2 AND b.is_published`;

// Order: $1 branch, $2 room type, $3 check-in, $4 check-out, $5 room count
// We lock the rooms here until the booking is finished.
// This stops two people from booking the same room at the same time.
export const FREE_ROOM_IDS = `
  SELECT r.id FROM rooms r
  WHERE r.branch_id = $1 AND r.room_type_id = $2
    AND r.status = '${RoomStatus.Active}'
    AND NOT EXISTS (
      SELECT 1 FROM booking_rooms br
      WHERE br.room_id = r.id AND br.active
        AND br.stay && daterange($3::date, $4::date, '${DATE_RANGE_BOUNDS}')
    )
  ORDER BY r.room_number
  LIMIT $5 FOR UPDATE OF r`;

export const INSERT_BOOKING = `
  INSERT INTO bookings (reference, branch_id, user_id, guest_name, guest_email, guest_phone,
    check_in, check_out, guests, special_requests, status, payment_status,
    access_token_hash, total_amount, hold_expires_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
    '${BookingStatus.Held}', '${PaymentStatus.Unpaid}', $11, $12, $13)
  RETURNING id`;

// One statement inserts every room, so the exclusion constraint sees them together.
export const INSERT_BOOKING_ROOMS = `
  INSERT INTO booking_rooms (booking_id, room_id, price_per_night, stay)
  SELECT $1, unnest($2::int[]), $3, daterange($4::date, $5::date, '${DATE_RANGE_BOUNDS}')`;

const BOOKING_COLUMNS = `
  b.special_requests AS "specialRequests",
  b.id, b.reference, b.user_id AS "userId",
  br.slug AS "branchSlug", br.name AS "branchName",
  b.guest_name AS "guestName", b.guest_email AS "guestEmail", b.guest_phone AS "guestPhone",
  to_char(b.check_in, 'YYYY-MM-DD') AS "checkIn",
  to_char(b.check_out, 'YYYY-MM-DD') AS "checkOut",
  b.guests, b.status, b.payment_status AS "paymentStatus",
  b.total_amount::float8 AS "totalAmount",
  (SELECT COALESCE(SUM(p.amount),0)::float8 FROM payments p
    WHERE p.booking_id=b.id AND p.status='${PaymentRecordStatus.Complete}') AS "amountPaid",
  b.hold_expires_at AS "holdExpiresAt",
  b.access_token_hash AS "accessTokenHash", b.created_at AS "createdAt"`;

export const BOOKING_BY_REFERENCE = `
  SELECT ${BOOKING_COLUMNS}
  FROM bookings b JOIN branches br ON br.id = b.branch_id
  WHERE b.reference = $1`;

export const BOOKING_BY_REFERENCE_FOR_UPDATE = `${BOOKING_BY_REFERENCE} FOR UPDATE OF b`;

export const ROOM_SUMMARY = `
  SELECT rt.name AS "roomType", COUNT(*)::int AS rooms,
         MAX(bkr.price_per_night)::float8 AS "pricePerNight"
  FROM booking_rooms bkr
  JOIN rooms r ON r.id = bkr.room_id
  JOIN room_types rt ON rt.id = r.room_type_id
  WHERE bkr.booking_id = $1
  GROUP BY rt.name`;

export const MARK_CANCELLED = `
  UPDATE bookings SET status = '${BookingStatus.Cancelled}', payment_status = $2, updated_at = now()
  WHERE id = $1`;

export const DEACTIVATE_ROOMS = `UPDATE booking_rooms SET active = false WHERE booking_id = $1`;

// Only a hold that is still alive can be paid for.
export const MARK_PAID_IF_HELD = `
  UPDATE bookings
  SET payment_status = '${PaymentStatus.Paid}', status = '${BookingStatus.PendingApproval}',
      hold_expires_at = NULL, updated_at = now()
  WHERE id = $1 AND status = '${BookingStatus.Held}' AND hold_expires_at > now()
  RETURNING id`;

export const INSERT_PAYMENT = `
  INSERT INTO payments (booking_id, provider, amount, status, raw_payload)
  VALUES ($1, $2, $3, '${PaymentRecordStatus.Complete}', $4)`;

export const RECORD_CANCELLATION = `
  INSERT INTO payments (booking_id,provider,amount,status,raw_payload)
  VALUES ($1,$2,$3,$4,$5)`;
