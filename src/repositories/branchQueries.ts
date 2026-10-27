import { DATE_RANGE_BOUNDS, RoomStatus } from "../constants/domain";

// $1 = checkIn, $2 = checkOut (both null when no dates chosen yet).
// A room is free when it is active and has no overlapping active booking.
const AVAILABLE_ROOM_COUNT = `
  (SELECT COUNT(*)::int FROM rooms r
    WHERE r.branch_id = brt.branch_id
      AND r.room_type_id = rt.id
      AND r.status = '${RoomStatus.Active}'
      AND ($1::date IS NULL OR NOT EXISTS (
        SELECT 1 FROM booking_rooms br
        WHERE br.room_id = r.id AND br.active
          AND br.stay && daterange($1::date, $2::date, '${DATE_RANGE_BOUNDS}')
      ))
  )`;

const ROOM_TYPE_AVAILABILITY = `
  SELECT brt.branch_id AS "branchId",
         rt.id AS "roomTypeId", rt.slug, rt.name, rt.tag, rt.description, rt.bed,
         rt.size_m2 AS "sizeM2", rt.capacity,
         brt.price_per_night::float8 AS "pricePerNight",
         ${AVAILABLE_ROOM_COUNT} AS "availableRooms"
  FROM branch_room_types brt
  JOIN room_types rt ON rt.id = brt.room_type_id`;

export const ROOM_TYPES_FOR_BRANCH = `
  ${ROOM_TYPE_AVAILABILITY}
  WHERE brt.branch_id = $3
  ORDER BY brt.price_per_night`;

// $3 guests, $4 rooms, $5 room type slug, $6 min price, $7 max price, $8 city
export const SEARCH_BRANCHES = `
  WITH avail AS (${ROOM_TYPE_AVAILABILITY}),
  fit AS (
    SELECT a.*, GREATEST($4::int, CEIL($3::numeric / a.capacity)::int) AS "roomsNeeded"
    FROM avail a
    WHERE ($5::text IS NULL OR a.slug = $5)
      AND ($6::numeric IS NULL OR a."pricePerNight" >= $6)
      AND ($7::numeric IS NULL OR a."pricePerNight" <= $7)
  )
  SELECT b.slug, b.name, b.city, b.address, b.star_rating AS "starRating",
         b.lat::float8 AS lat, b.lng::float8 AS lng,
         (SELECT url FROM branch_images bi WHERE bi.branch_id = b.id ORDER BY sort_order LIMIT 1) AS "imageUrl",
         (SELECT alt FROM branch_images bi WHERE bi.branch_id = b.id ORDER BY sort_order LIMIT 1) AS "imageAlt",
         MIN(f."pricePerNight") AS "fromPrice"
  FROM branches b
  JOIN fit f ON f."branchId" = b.id AND f."availableRooms" >= f."roomsNeeded"
  WHERE b.is_published AND ($8::text IS NULL OR b.city ILIKE $8)
  GROUP BY b.id
  ORDER BY b.name`;

export const BRANCH_BY_SLUG = `
  SELECT id, slug, name, description, address, city,
         lat::float8 AS lat, lng::float8 AS lng, phone, email,
         star_rating AS "starRating",
         to_char(check_in_time, 'HH24:MI') AS "checkInTime",
         to_char(check_out_time, 'HH24:MI') AS "checkOutTime"
  FROM branches
  WHERE slug = $1 AND is_published`;

export const BRANCH_IMAGES = `
  SELECT url, alt FROM branch_images WHERE branch_id = $1 ORDER BY sort_order`;

export const BRANCH_AMENITIES = `
  SELECT a.name, a.icon
  FROM branch_amenities ba JOIN amenities a ON a.id = ba.amenity_id
  WHERE ba.branch_id = $1
  ORDER BY a.name`;

export const BRANCH_POLICIES = `
  SELECT type, title, body FROM policies WHERE branch_id = $1 ORDER BY sort_order`;

export const ROOM_TYPE_IMAGES = `
  SELECT room_type_id AS "roomTypeId", url, alt
  FROM room_type_images
  WHERE room_type_id = ANY($1::int[])
  ORDER BY sort_order`;

export const ROOM_TYPE_AMENITIES = `
  SELECT rta.room_type_id AS "roomTypeId", a.name, a.icon
  FROM room_type_amenities rta JOIN amenities a ON a.id = rta.amenity_id
  WHERE rta.room_type_id = ANY($1::int[])
  ORDER BY a.name`;
