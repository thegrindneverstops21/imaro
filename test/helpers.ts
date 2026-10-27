import { pool } from "../src/db/pool";
import { MS_PER_DAY } from "../src/constants/domain";
import { todayIso } from "../src/domain/rules";

export const API = "/api/v1";
export const TEST_REF_PREFIX = "TEST-";

export function daysFromToday(days: number): string {
  return todayIso(new Date(Date.now() + days * MS_PER_DAY));
}

export async function createBooking(reference: string, checkIn: string, checkOut: string): Promise<number> {
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO bookings (reference, branch_id, guest_name, guest_email, guest_phone,
       check_in, check_out, guests, access_token_hash, total_amount)
     SELECT $1, id, 'Test Guest', 'test@example.com', '0000000000', $2, $3, 1, 'hash', 0
     FROM branches WHERE slug = 'polokwane'
     RETURNING id`,
    [reference, checkIn, checkOut],
  );
  return rows[0]!.id;
}

export function holdRoom(bookingId: number, roomNumber: string, checkIn: string, checkOut: string) {
  return pool.query(
    `INSERT INTO booking_rooms (booking_id, room_id, price_per_night, stay)
     SELECT $1, r.id, 0, daterange($3::date, $4::date, '[)')
     FROM rooms r JOIN branches b ON b.id = r.branch_id
     WHERE b.slug = 'polokwane' AND r.room_number = $2`,
    [bookingId, roomNumber, checkIn, checkOut],
  );
}

export const removeTestBookings = () =>
  pool.query(`DELETE FROM bookings WHERE reference LIKE $1`, [`${TEST_REF_PREFIX}%`]);
