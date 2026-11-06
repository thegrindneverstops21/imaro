import { MS_PER_DAY, UserRole } from "../src/constants/domain";
import { encodeSession, newSession } from "../src/auth/session";
import { pool } from "../src/db/pool";
import { todayIso } from "../src/domain/rules";

export const API = "/api/v1";
export const TEST_REF_PREFIX = "TEST-";
export const TEST_EMAIL_DOMAIN = "@test.example";

// "YYYY-MM-DD", `days` days from now. Negative values are in the past (used to test reviews of finished stays).
export function daysFromToday(days: number): string {
  return todayIso(new Date(Date.now() + days * MS_PER_DAY));
}

// Inserts a bare booking row directly, bypassing the API, for tests that only care about later behaviour (admin actions, reviews...).
export async function createBooking(
  reference: string,
  checkIn: string,
  checkOut: string,
): Promise<number> {
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

// Attaches a physical room to a booking for the given dates, which is what makes the room unavailable.
export function holdRoom(
  bookingId: number,
  roomNumber: string,
  checkIn: string,
  checkOut: string,
) {
  return pool.query(
    `INSERT INTO booking_rooms (booking_id, room_id, price_per_night, stay)
     SELECT $1, r.id, 0, daterange($3::date, $4::date, '[)')
     FROM rooms r JOIN branches b ON b.id = r.branch_id
     WHERE b.slug = 'polokwane' AND r.room_number = $2`,
    [bookingId, roomNumber, checkIn, checkOut],
  );
}

export interface TestUser {
  id: number;
  token: string;
}

// Creates a user and a valid session token for them (the Google flow itself is tested separately).
export async function createUser(
  email: string,
  role: string = UserRole.Guest,
): Promise<TestUser> {
  const { rows } = await pool.query<{ id: number; name: string }>(
    `INSERT INTO users (name, email, role) VALUES ('Test User', $1, $2) RETURNING id, name`,
    [email, role],
  );
  const user = { id: rows[0]!.id, email, name: rows[0]!.name, role };
  return { id: user.id, token: encodeSession(newSession(user, Date.now())) };
}

// Run in afterEach so one failing test cannot affect the next.
// Removes everything the tests created: helper bookings, API bookings and test users.
export async function removeTestBookings(): Promise<void> {
  await pool.query(
    `DELETE FROM bookings WHERE reference LIKE $1 OR guest_email LIKE $2`,
    [`${TEST_REF_PREFIX}%`, `%${TEST_EMAIL_DOMAIN}`],
  );
  await pool.query(`DELETE FROM users WHERE email LIKE $1`, [
    `%${TEST_EMAIL_DOMAIN}`,
  ]);
}
