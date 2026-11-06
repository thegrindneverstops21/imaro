import request from "supertest";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { app } from "../../backend/src/app";
import { pool } from "../../backend/src/db/pool";
import {
  API,
  createBooking,
  createUser,
  daysFromToday,
  holdRoom,
  removeTestBookings,
} from "../helpers";

const adminRequest = (path: string, token: string) =>
  request(app)
    .get(`${API}/admin${path}`)
    .set("authorization", `Bearer ${token}`);
const testSlug = () =>
  `admin-test-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const branchBody = (slug: string) => ({
  slug,
  name: "Admin Test Hotel",
  description: "A hotel created by the admin API test.",
  address: "1 Test Street",
  city: "Polokwane",
  lat: -23.9045,
  lng: 29.4689,
  phone: "+27150000000",
  email: "admin-test@example.com",
  starRating: 4,
});

async function createAdmin() {
  return createUser(
    `admin-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@test.example`,
    "admin",
  );
}

async function deleteTestBranches(): Promise<void> {
  await pool.query("DELETE FROM branches WHERE slug LIKE 'admin-test-%'");
}

afterEach(async () => {
  await removeTestBookings();
  await deleteTestBranches();
});
afterAll(() => pool.end());

describe("admin authorization", () => {
  it("requires a signed-in admin for admin routes", async () => {
    expect((await request(app).get(`${API}/admin/branches`)).status).toBe(401);
    const guest = await createUser("admin-guest@test.example");
    const response = await adminRequest("/branches", guest.token);
    expect(response.status).toBe(403);
    for (const path of ["/bookings", "/bookings/TEST-MISSING"]) {
      expect((await request(app).get(`${API}/admin${path}`)).status).toBe(401);
      expect((await adminRequest(path, guest.token)).status).toBe(403);
    }
  });
});

describe("admin branch, room, and price management", () => {
  it("creates, edits, lists, and unpublishes a branch", async () => {
    const admin = await createAdmin();
    const slug = testSlug();
    const created = await request(app)
      .post(`${API}/admin/branches`)
      .set("authorization", `Bearer ${admin.token}`)
      .send(branchBody(slug));
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ slug, isPublished: true });

    await request(app).patch(`${API}/admin/branches/${created.body.data.id}`)
      .set("authorization", `Bearer ${admin.token}`)
      .send({ isPublished: false, checkInTime: "16:00", checkOutTime: "11:00" });
    const duplicate = await request(app).post(`${API}/admin/branches`)
      .set("authorization", `Bearer ${admin.token}`).send(branchBody(slug));
    expect(duplicate.status).toBe(409);
    const changed = await request(app)
      .patch(`${API}/admin/branches/${created.body.data.id}`)
      .set("authorization", `Bearer ${admin.token}`)
      .send({ name: "Updated Admin Test Hotel" });
    expect(changed.status).toBe(200);
    expect(changed.body.data).toMatchObject({ isPublished: false, checkInTime: "16:00", checkOutTime: "11:00" });
    expect(changed.body.data.name).toBe("Updated Admin Test Hotel");

    const list = await adminRequest("/branches", admin.token);
    expect(list.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: created.body.data.id, slug }),
      ]),
    );

    const hidden = await request(app)
      .delete(`${API}/admin/branches/${created.body.data.id}`)
      .set("authorization", `Bearer ${admin.token}`);
    expect(hidden.status).toBe(200);
    expect(hidden.body.data.isPublished).toBe(false);
  });

  it("manages rooms and branch room prices", async () => {
    const admin = await createAdmin();
    const createdBranch = await request(app)
      .post(`${API}/admin/branches`)
      .set("authorization", `Bearer ${admin.token}`)
      .send(branchBody(testSlug()));
    const branchId = createdBranch.body.data.id as number;
    const { rows: roomTypes } = await pool.query<{ id: number }>(
      "SELECT id FROM room_types WHERE slug = 'classic'",
    );
    const roomTypeId = roomTypes[0]!.id;

    const roomResponse = await request(app)
      .post(`${API}/admin/branches/${branchId}/rooms`)
      .set("authorization", `Bearer ${admin.token}`)
      .send({ roomTypeId, roomNumber: "T-101" });
    expect(roomResponse.status).toBe(201);
    expect(roomResponse.body.data).toMatchObject({
      branchId,
      roomTypeId,
      status: "active",
    });

    const duplicate = await request(app).post(`${API}/admin/branches/${branchId}/rooms`)
      .set("authorization", `Bearer ${admin.token}`).send({ roomTypeId, roomNumber: "T-101" });
    expect(duplicate.status).toBe(409);
    const badType = await request(app).post(`${API}/admin/branches/${branchId}/rooms`)
      .set("authorization", `Bearer ${admin.token}`).send({ roomTypeId: 2147483647, roomNumber: "T-999" });
    expect(badType.status).toBe(400);
    const rooms = await adminRequest(
      `/branches/${branchId}/rooms`,
      admin.token,
    );
    expect(rooms.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: roomResponse.body.data.id,
          roomNumber: "T-101",
        }),
      ]),
    );

    const updatedRoom = await request(app)
      .patch(`${API}/admin/rooms/${roomResponse.body.data.id}`)
      .set("authorization", `Bearer ${admin.token}`)
      .send({ roomNumber: "T-102" });
    expect(updatedRoom.body.data.roomNumber).toBe("T-102");

    const price = await request(app)
      .put(`${API}/admin/branches/${branchId}/prices/${roomTypeId}`)
      .set("authorization", `Bearer ${admin.token}`)
      .send({ pricePerNight: 1800 });
    expect(price.status).toBe(200);
    expect(price.body.data.pricePerNight).toBe(1800);
    expect(
      (await adminRequest(`/branches/${branchId}/prices`, admin.token)).body
        .data,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ roomTypeId, pricePerNight: 1800 }),
      ]),
    );

    const removedPrice = await request(app)
      .delete(`${API}/admin/branches/${branchId}/prices/${roomTypeId}`)
      .set("authorization", `Bearer ${admin.token}`);
    expect(removedPrice.body.data).toMatchObject({
      branchId,
      roomTypeId,
      removed: true,
    });

    const retired = await request(app)
      .delete(`${API}/admin/rooms/${roomResponse.body.data.id}`)
      .set("authorization", `Bearer ${admin.token}`);
    expect(retired.body.data.status).toBe("maintenance");
  });
});

describe("admin reservation management", () => {
  async function pendingPaidBooking(
    reference: string,
    checkIn: string,
    checkOut: string,
  ) {
    const bookingId = await createBooking(reference, checkIn, checkOut);
    await holdRoom(bookingId, "101", checkIn, checkOut);
    await pool.query(
      "UPDATE bookings SET status='pending_approval', payment_status='paid', hold_expires_at=NULL WHERE id=$1",
      [bookingId],
    );
    await pool.query("UPDATE bookings SET total_amount=2700 WHERE id=$1", [bookingId]);
    await pool.query("UPDATE booking_rooms SET price_per_night=1350 WHERE booking_id=$1", [bookingId]);
    await pool.query("INSERT INTO payments (booking_id,provider,amount,status) VALUES ($1,'simulated',2700,'complete')", [bookingId]);
    return bookingId;
  }

  it("approves a paid pending reservation", async () => {
    const admin = await createAdmin();
    const reference = "TEST-ADMIN-APPROVE";
    await pendingPaidBooking(reference, daysFromToday(30), daysFromToday(32));
    const response = await request(app)
      .post(`${API}/admin/bookings/${reference}/approve`)
      .set("authorization", `Bearer ${admin.token}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      reference,
      status: "confirmed",
      paymentStatus: "paid",
    });
  });

  it("changes reservation dates and updates its room range", async () => {
    const admin = await createAdmin();
    const reference = "TEST-ADMIN-MODIFY";
    const bookingId = await pendingPaidBooking(
      reference,
      daysFromToday(30),
      daysFromToday(32),
    );
    const checkIn = daysFromToday(35);
    const checkOut = daysFromToday(40);
    const response = await request(app)
      .patch(`${API}/admin/bookings/${reference}`)
      .set("authorization", `Bearer ${admin.token}`)
      .send({ checkIn, checkOut, guests: 2 });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      reference,
      checkIn,
      checkOut,
      guests: 2,
      totalAmount: 6750,
      amountPaid: 2700,
      balanceDue: 4050,
    });
    const { rows } = await pool.query<{ stay: string }>(
      "SELECT stay::text AS stay FROM booking_rooms WHERE booking_id=$1 AND active",
      [bookingId],
    );
    expect(rows[0]!.stay).toContain(`[${checkIn},${checkOut})`);
    const detail = await adminRequest(`/bookings/${reference}`, admin.token);
    expect(detail.body.data).toMatchObject({ amountPaid: 2700, balanceDue: 4050 });
    const cancelled = await request(app).post(`${API}/admin/bookings/${reference}/cancel`)
      .set("authorization", `Bearer ${admin.token}`);
    expect(cancelled.body.data.cancellation.refund).toBe(2700);
    const refund = await pool.query("SELECT amount::float8 AS amount FROM payments WHERE booking_id=$1 AND status='refunded'", [bookingId]);
    expect(refund.rows[0].amount).toBe(2700);
  });

  it("reallocates a room when the original overlaps another reservation", async () => {
    const admin = await createAdmin();
    const checkIn = daysFromToday(40);
    const checkOut = daysFromToday(42);
    const bookingId = await pendingPaidBooking(
      "TEST-ADMIN-CONFLICT",
      daysFromToday(30),
      daysFromToday(32),
    );
    const otherBookingId = await createBooking(
      "TEST-ADMIN-OTHER",
      checkIn,
      checkOut,
    );
    await holdRoom(otherBookingId, "101", checkIn, checkOut);
    const response = await request(app)
      .patch(`${API}/admin/bookings/TEST-ADMIN-CONFLICT`)
      .set("authorization", `Bearer ${admin.token}`)
      .send({ checkIn, checkOut });
    expect(response.status).toBe(200);
    const { rows } = await pool.query<{ checkIn: string }>(
      "SELECT to_char(check_in,'YYYY-MM-DD') AS \"checkIn\" FROM bookings WHERE id=$1",
      [bookingId],
    );
    expect(rows[0]!.checkIn).toBe(checkIn);
    const allocated = await pool.query("SELECT r.room_number FROM booking_rooms br JOIN rooms r ON r.id=br.room_id WHERE br.booking_id=$1 AND br.active", [bookingId]);
    expect(allocated.rows[0].room_number).not.toBe("101");
  });

  it("cancels the reservation and releases its room", async () => {
    const admin = await createAdmin();
    const reference = "TEST-ADMIN-CANCEL";
    const bookingId = await pendingPaidBooking(
      reference,
      daysFromToday(30),
      daysFromToday(32),
    );
    const response = await request(app)
      .post(`${API}/admin/bookings/${reference}/cancel`)
      .set("authorization", `Bearer ${admin.token}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      reference,
      status: "cancelled",
      paymentStatus: "refunded",
      cancellation: { fee: 0, refund: 2700 },
    });
    const { rows } = await pool.query<{ active: boolean }>(
      "SELECT active FROM booking_rooms WHERE booking_id=$1",
      [bookingId],
    );
    expect(rows[0]!.active).toBe(false);
  });
});
  it("rejects missing resources", async () => {
    const admin = await createAdmin();
    const response = await request(app).patch(`${API}/admin/branches/2147483647`)
      .set("authorization", `Bearer ${admin.token}`).send({ name: "Missing" });
    expect(response.status).toBe(404);
  });

  it("protects booked rooms and rejects excess guests without changing the reservation", async () => {
    const admin = await createAdmin();
    const id = await createBooking("TEST-GUARD", daysFromToday(30), daysFromToday(32));
    await holdRoom(id, "101", daysFromToday(30), daysFromToday(32));
    await pool.query("UPDATE bookings SET status='confirmed' WHERE id=$1", [id]);
    const { rows } = await pool.query("SELECT room_id FROM booking_rooms WHERE booking_id=$1", [id]);
    const roomId = rows[0].room_id;
    const auth = `Bearer ${admin.token}`;
    expect((await request(app).delete(`${API}/admin/rooms/${roomId}`).set("authorization", auth)).status).toBe(409);
    expect((await request(app).patch(`${API}/admin/rooms/${roomId}`).set("authorization", auth).send({ roomTypeId: 2147483647 })).status).toBe(409);
    expect((await request(app).patch(`${API}/admin/bookings/TEST-GUARD`).set("authorization", auth).send({ guests: 10 })).status).toBe(400);
    const detail = await adminRequest("/bookings/TEST-GUARD", admin.token);
    expect(detail.status).toBe(200);
    expect(detail.body.data.guests).toBe(1);
    expect(JSON.stringify(detail.body)).not.toContain("accessTokenHash");
    const list = await adminRequest("/bookings?status=confirmed&limit=1&offset=0", admin.token);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].reference).toBe("TEST-GUARD");
    expect((await adminRequest("/bookings?status=invalid", admin.token)).status).toBe(400);
  });

  it("rejects cancellation after check-in", async () => {
    const admin = await createAdmin();
    await createBooking("TEST-STARTED", daysFromToday(-1), daysFromToday(2));
    const response = await request(app).post(`${API}/admin/bookings/TEST-STARTED/cancel`)
      .set("authorization", `Bearer ${admin.token}`);
    expect(response.status).toBe(409);
  });

  it("rolls back a failed reallocation when all rooms are occupied", async () => {
    const admin = await createAdmin();
    const originalIn = daysFromToday(30), originalOut = daysFromToday(32);
    const checkIn = daysFromToday(40), checkOut = daysFromToday(42);
    const id = await createBooking("TEST-ROLLBACK", originalIn, originalOut);
    await holdRoom(id, "101", originalIn, originalOut);
    await pool.query("UPDATE bookings SET status='confirmed',total_amount=2700 WHERE id=$1", [id]);
    const other = await createBooking("TEST-FULL", checkIn, checkOut);
    await pool.query(`INSERT INTO booking_rooms (booking_id,room_id,price_per_night,stay)
      SELECT $1,r.id,1350,daterange($2::date,$3::date,'[)') FROM rooms r
      JOIN branches b ON b.id=r.branch_id JOIN room_types rt ON rt.id=r.room_type_id
      WHERE b.slug='polokwane' AND rt.slug='classic'`, [other, checkIn, checkOut]);
    const response = await request(app).patch(`${API}/admin/bookings/TEST-ROLLBACK`)
      .set("authorization", `Bearer ${admin.token}`).send({ checkIn, checkOut });
    expect(response.status).toBe(409);
    const detail = await adminRequest("/bookings/TEST-ROLLBACK", admin.token);
    expect(detail.body.data).toMatchObject({ checkIn: originalIn, checkOut: originalOut, totalAmount: 2700 });
    expect(detail.body.data.rooms[0].rooms).toBe(1);
  });

  it("applies and records the first-night cancellation fee", async () => {
    const admin = await createAdmin();
    const id = await createBooking("TEST-LATE-CANCEL", daysFromToday(1), daysFromToday(3));
    await holdRoom(id, "101", daysFromToday(1), daysFromToday(3));
    await pool.query("UPDATE bookings SET status='confirmed',payment_status='paid',total_amount=2700 WHERE id=$1", [id]);
    await pool.query("UPDATE booking_rooms SET price_per_night=1350 WHERE booking_id=$1", [id]);
    await pool.query("INSERT INTO payments (booking_id,provider,amount,status) VALUES ($1,'simulated',2700,'complete')", [id]);
    const response = await request(app).post(`${API}/admin/bookings/TEST-LATE-CANCEL/cancel`)
      .set("authorization", `Bearer ${admin.token}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ paymentStatus: "refunded", cancellation: { fee: 1350, refund: 1350 } });
    const { rows } = await pool.query("SELECT raw_payload FROM payments WHERE booking_id=$1 AND status='refunded'", [id]);
    expect(rows[0].raw_payload).toMatchObject({ fee: 1350, refund: 1350, simulated: true });
    expect((await request(app).post(`${API}/admin/bookings/TEST-LATE-CANCEL/cancel`)
      .set("authorization", `Bearer ${admin.token}`)).status).toBe(409);
  });

async function testBranch(token: string) {
  const response = await request(app).post(`${API}/admin/branches`)
    .set("authorization", `Bearer ${token}`).send(branchBody(testSlug()));
  expect(response.status).toBe(201);
  return response.body.data;
}

describe("admin regression cases", () => {
  it("rename-only PATCH preserves unpublished status and custom check-in/out times", async () => {
    const { token } = await createAdmin();
    const branch = await testBranch(token);
    const url = `${API}/admin/branches/${branch.id}`;
    await request(app).patch(url).set("authorization", `Bearer ${token}`)
      .send({ isPublished: false, checkInTime: "16:00", checkOutTime: "11:00" }).expect(200);
    const response = await request(app).patch(url).set("authorization", `Bearer ${token}`)
      .send({ name: "Renamed only" });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ name: "Renamed only", isPublished: false,
      checkInTime: "16:00", checkOutTime: "11:00", slug: branch.slug });
  });

  it("returns 409 for duplicate branch slugs on creation and PATCH", async () => {
    const { token } = await createAdmin();
    const branch = await testBranch(token);
    await request(app).post(`${API}/admin/branches`).set("authorization", `Bearer ${token}`)
      .send(branchBody(branch.slug)).expect(409);
    const other = await testBranch(token);
    await request(app).patch(`${API}/admin/branches/${other.id}`).set("authorization", `Bearer ${token}`)
      .send({ slug: branch.slug }).expect(409);
  });

  it("returns 409 for duplicate room numbers and 400 for invalid room-type references", async () => {
    const { token } = await createAdmin();
    const branch = await testBranch(token);
    const { rows } = await pool.query("SELECT id FROM room_types WHERE slug='classic'");
    const roomTypeId = rows[0].id;
    const url = `${API}/admin/branches/${branch.id}/rooms`;
    const auth = `Bearer ${token}`;
    await request(app).post(url).set("authorization", auth).send({ roomTypeId, roomNumber: "R1" }).expect(201);
    await request(app).post(url).set("authorization", auth).send({ roomTypeId, roomNumber: "R1" }).expect(409);
    await request(app).post(url).set("authorization", auth).send({ roomTypeId: 2147483647, roomNumber: "R2" }).expect(400);
    const other = await request(app).post(url).set("authorization", auth).send({ roomTypeId, roomNumber: "R2" });
    await request(app).patch(`${API}/admin/rooms/${other.body.data.id}`).set("authorization", auth)
      .send({ roomNumber: "R1" }).expect(409);
    await request(app).patch(`${API}/admin/rooms/${other.body.data.id}`).set("authorization", auth)
      .send({ roomTypeId: 2147483647 }).expect(400);
  });
});

describe("admin reservation list and detail", () => {
  it("returns filtered totals with deterministic pages, including an offset beyond the last page", async () => {
    const { token } = await createAdmin();
    await createBooking("TEST-PAGE-A", daysFromToday(10), daysFromToday(12));
    await createBooking("TEST-PAGE-B", daysFromToday(10), daysFromToday(13));
    await createBooking("TEST-EXCLUDED", daysFromToday(20), daysFromToday(22));
    const filters = `search=test-page&dateFrom=${daysFromToday(10)}&dateTo=${daysFromToday(10)}&limit=1`;
    const first = await adminRequest(`/bookings?${filters}`, token);
    const second = await adminRequest(`/bookings?${filters}&offset=1`, token);
    const empty = await adminRequest(`/bookings?${filters}&offset=50`, token);
    expect(first.status).toBe(200);
    expect(first.body.meta).toEqual({ total: 2, limit: 1, offset: 0 });
    expect(second.body.meta.total).toBe(2);
    expect(first.body.data[0].reference).not.toBe(second.body.data[0].reference);
    expect(empty.body).toEqual({ data: [], meta: { total: 2, limit: 1, offset: 50 } });
    const none = await adminRequest("/bookings?search=no-match", token);
    expect(none.body.meta.total).toBe(0);
    expect(none.body.data).toEqual([]);
  });

  it("combines branch, status, payment, name/email search and one-sided dates", async () => {
    const { token } = await createAdmin();
    const id = await createBooking("TEST-FILTER", daysFromToday(10), daysFromToday(12));
    const { rows } = await pool.query(`UPDATE bookings SET guest_name='Distinct Person',guest_email='unique@test.example',
      status='confirmed',payment_status='paid',total_amount=2700 WHERE id=$1 RETURNING branch_id`, [id]);
    const query = `branchId=${rows[0].branch_id}&status=confirmed&paymentStatus=paid&dateFrom=${daysFromToday(10)}`;
    for (const search of ["DISTINCT", "unique@test.example", "TEST-FILTER"]) {
      const response = await adminRequest(`/bookings?${query}&search=${encodeURIComponent(search)}`, token);
      expect(response.status).toBe(200);
      expect(response.body.meta.total).toBe(1);
      expect(response.body.data[0].reference).toBe("TEST-FILTER");
    }
    expect((await adminRequest(`/bookings?search=TEST-FILTER&dateTo=${daysFromToday(9)}`, token)).body.meta.total).toBe(0);
    expect((await adminRequest("/bookings?search=%25", token)).body.meta.total).toBe(0);
  });

  it.each(["dateFrom=2026-02-30", "dateTo=bad", "dateFrom=2026-11-10&dateTo=2026-11-01", "limit=0", "offset=-1", "limit=101"])(
    "rejects invalid list filters: %s", async (query) => {
      const { token } = await createAdmin();
      expect((await adminRequest(`/bookings?${query}`, token)).status).toBe(400);
    });

  it("returns assigned room numbers, special requests and safe payment history", async () => {
    const { token } = await createAdmin();
    const id = await createBooking("TEST-DETAIL", daysFromToday(10), daysFromToday(12));
    await holdRoom(id, "101", daysFromToday(10), daysFromToday(12));
    await pool.query("UPDATE bookings SET special_requests='Quiet room please',total_amount=2700 WHERE id=$1", [id]);
    await pool.query(`INSERT INTO payments (booking_id,provider,provider_ref,amount,status,raw_payload)
      VALUES ($1,'simulated','payment-123',2700,'complete','{"secret":"private-provider-data"}')`, [id]);
    const response = await adminRequest("/bookings/TEST-DETAIL", token);
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ specialRequests: "Quiet room please", amountPaid: 2700, balanceDue: 0 });
    expect(response.body.data.assignedRooms[0]).toMatchObject({ roomNumber: "101", roomType: "Classic Room", active: true });
    expect(response.body.data.payments[0]).toMatchObject({ provider: "simulated", providerReference: "payment-123", amount: 2700, status: "complete" });
    expect(JSON.stringify(response.body)).not.toMatch(/accessTokenHash|raw_payload|private-provider-data/);
    expect((await adminRequest("/bookings/DOES-NOT-EXIST", token)).status).toBe(404);
  });

  it("immediately rejects a revoked admin on list and detail", async () => {
    const admin = await createAdmin();
    await pool.query("UPDATE users SET role='guest' WHERE id=$1", [admin.id]);
    expect((await adminRequest("/bookings", admin.token)).status).toBe(403);
    expect((await adminRequest("/bookings/TEST-DETAIL", admin.token)).status).toBe(403);
  });
});
