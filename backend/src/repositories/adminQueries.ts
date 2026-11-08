import {
  BookingStatus,
  PaymentStatus,
  PaymentRecordStatus,
} from "../constants/domain";

const branchColumns = `id, slug, name, description, address, city, lat::float8 AS lat,
  lng::float8 AS lng, phone, email, star_rating AS "starRating",
  to_char(check_in_time, 'HH24:MI') AS "checkInTime",
  to_char(check_out_time, 'HH24:MI') AS "checkOutTime", is_published AS "isPublished"`;

export const LIST_BRANCHES = `SELECT ${branchColumns} FROM branches ORDER BY name`;

export const LIST_ROOM_TYPES = `SELECT id AS "roomTypeId", name, capacity FROM room_types ORDER BY name`;
export const CREATE_BRANCH_IMAGE = `INSERT INTO branch_images (branch_id,url,alt,sort_order) VALUES ($1,$2,$3,$4)`;
export const ENSURE_AMENITY = `INSERT INTO amenities (name,scope) VALUES ($1,'hotel') ON CONFLICT (name) DO NOTHING`;
export const ADD_BRANCH_AMENITY = `INSERT INTO branch_amenities (branch_id,amenity_id) SELECT $1,id FROM amenities WHERE name=$2 ON CONFLICT DO NOTHING`;
export const CREATE_BRANCH_POLICY = `INSERT INTO policies (branch_id,type,title,body,sort_order) VALUES ($1,$2,$3,$4,$5)`;

export const GET_BRANCH = `SELECT ${branchColumns} FROM branches WHERE id = $1`;

export const CREATE_BRANCH = `INSERT INTO branches
    (slug,name,description,address,city,lat,lng,phone,email,star_rating,check_in_time,check_out_time,is_published)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING ${branchColumns}`;

export const UPDATE_BRANCH = (assignments: string) =>
  `UPDATE branches SET ${assignments} WHERE id = $1 RETURNING ${branchColumns}`;

export const UNPUBLISH_BRANCH = `UPDATE branches SET is_published = false WHERE id = $1 RETURNING id, is_published AS "isPublished"`;

export const LIST_ROOMS = `SELECT r.id, r.branch_id AS "branchId", r.room_type_id AS "roomTypeId",
  rt.name AS "roomType", r.room_number AS "roomNumber", r.status FROM rooms r
  JOIN room_types rt ON rt.id = r.room_type_id WHERE r.branch_id = $1 ORDER BY r.room_number`;

export const CREATE_ROOM = `INSERT INTO rooms (branch_id,room_type_id,room_number,status)
    VALUES ($1,$2,$3,$4) RETURNING id, branch_id AS "branchId", room_type_id AS "roomTypeId", room_number AS "roomNumber", status`;

export const UPDATE_ROOM = (
  assignments: string,
) => `UPDATE rooms SET ${assignments} WHERE id = $1
    RETURNING id, branch_id AS "branchId", room_type_id AS "roomTypeId", room_number AS "roomNumber", status`;

export const LIST_PRICES = `SELECT rt.id AS "roomTypeId", rt.slug AS "roomType", rt.name,
  brt.price_per_night::float8 AS "pricePerNight" FROM branch_room_types brt
  JOIN room_types rt ON rt.id = brt.room_type_id WHERE brt.branch_id = $1 ORDER BY rt.name`;

export const UPSERT_PRICE = `INSERT INTO branch_room_types (branch_id,room_type_id,price_per_night)
    VALUES ($1,$2,$3) ON CONFLICT (branch_id,room_type_id) DO UPDATE SET price_per_night = EXCLUDED.price_per_night
    RETURNING branch_id AS "branchId", room_type_id AS "roomTypeId", price_per_night::float8 AS "pricePerNight"`;

export const DELETE_PRICE = `DELETE FROM branch_room_types WHERE branch_id = $1 AND room_type_id = $2 RETURNING branch_id`;

export const APPROVE_BOOKING = `UPDATE bookings SET status='${BookingStatus.Confirmed}', updated_at=now()
    WHERE id=$1 AND status='${BookingStatus.PendingApproval}' AND payment_status='${PaymentStatus.Paid}' RETURNING reference,status,payment_status AS "paymentStatus"`;

// FOR UPDATE locks the room row so a concurrent booking cannot slip in between the "is it free?" check and the update.
export const ROOM_FOR_UPDATE = `SELECT room_type_id AS "roomTypeId" FROM rooms WHERE id=$1 FOR UPDATE`;

export const LIVE_RESERVATIONS = `SELECT 1 FROM booking_rooms
    WHERE room_id=$1 AND active AND upper(stay)>$2::date LIMIT 1`;

export const BOOKING_ALLOCATIONS = `SELECT r.room_type_id AS "roomTypeId", r.branch_id AS "branchId", rt.capacity,
    br.price_per_night::float8 AS price FROM booking_rooms br
    JOIN rooms r ON r.id=br.room_id JOIN room_types rt ON rt.id=r.room_type_id
    WHERE br.booking_id=$1 AND br.active`;

export const CLEAR_ALLOCATIONS = `DELETE FROM booking_rooms WHERE booking_id=$1`;

export const UPDATE_BOOKING = `UPDATE bookings SET check_in=$2, check_out=$3, guests=$4,
    total_amount=$5, updated_at=now() WHERE id=$1`;

// Count and page share one database snapshot, including offsets beyond the last page.
export const RESERVATIONS = `
  WITH filtered AS (
    SELECT b.id, b.reference, b.status, b.payment_status AS "paymentStatus",
      br.name AS "branchName", to_char(b.check_in,'YYYY-MM-DD') AS "checkIn",
      to_char(b.check_out,'YYYY-MM-DD') AS "checkOut", b.guests,
      b.total_amount::float8 AS "totalAmount", paid.amount::float8 AS "amountPaid",
      (b.total_amount - paid.amount)::float8 AS "balanceDue",
      b.guest_name AS "guestName", b.guest_email AS "guestEmail",
      b.guest_phone AS "guestPhone", b.created_at AS "createdAt"
    FROM bookings b JOIN branches br ON br.id=b.branch_id
    CROSS JOIN LATERAL (
      SELECT COALESCE(SUM(p.amount),0) AS amount FROM payments p
      WHERE p.booking_id=b.id AND p.status='${PaymentRecordStatus.Complete}'
    ) paid
    WHERE ($3::text IS NULL OR b.status=$3)
      AND ($4::text IS NULL OR b.payment_status=$4)
      AND ($5::int IS NULL OR b.branch_id=$5)
      AND ($6::text IS NULL OR strpos(lower(concat_ws(' ',b.reference,b.guest_name,b.guest_email)),lower($6))>0)
      AND ($7::date IS NULL OR b.check_in >= $7)
      AND ($8::date IS NULL OR b.check_in <= $8)
  ), page AS (
    SELECT * FROM filtered ORDER BY "createdAt" DESC,id DESC LIMIT $1 OFFSET $2
  )
  SELECT (SELECT COUNT(*)::int FROM filtered) AS total,
    COALESCE((SELECT jsonb_agg(to_jsonb(page) - 'id' ORDER BY "createdAt" DESC,id DESC) FROM page),'[]'::jsonb) AS data`;

export const ASSIGNED_ROOMS = `
  SELECT r.id AS "roomId", r.room_number AS "roomNumber", rt.name AS "roomType",
    br.price_per_night::float8 AS "pricePerNight", br.active
  FROM booking_rooms br JOIN rooms r ON r.id=br.room_id
  JOIN room_types rt ON rt.id=r.room_type_id
  WHERE br.booking_id=$1 ORDER BY r.room_number,r.id`;

// Never expose provider raw payloads or private booking access credentials.
export const BOOKING_PAYMENTS = `
  SELECT id,provider,provider_ref AS "providerReference",amount::float8 AS amount,
    status,created_at AS "createdAt"
  FROM payments WHERE booking_id=$1 ORDER BY created_at,id`;
