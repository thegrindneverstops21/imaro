import request from "supertest";
import { afterAll, afterEach, expect, it, vi } from "vitest";
import { app } from "../../.vscode/src/app";
import { pool } from "../../.vscode/src/db/pool";
import * as notifications from "../../.vscode/src/repositories/notificationRepository";
import { API, createUser, daysFromToday, removeTestBookings } from "../helpers";

afterEach(async () => {
  vi.restoreAllMocks();
  await removeTestBookings();
});
afterAll(() => pool.end());

it("rolls back payment and ledger writes when the notification cannot be stored", async () => {
  const created = await request(app)
    .post(`${API}/bookings`)
    .send({
      branchSlug: "polokwane",
      roomType: "classic",
      checkIn: daysFromToday(50),
      checkOut: daysFromToday(52),
      guests: 2,
      rooms: 1,
      guestName: "Notify Guest",
      guestEmail: "rollback@test.example",
      guestPhone: "0821234567",
    });
  const { reference, manageToken } = created.body.data;
  vi.spyOn(notifications, "insertNotification").mockImplementation(
    async (db) => {
      await db.query("SELECT 1/0");
      return [];
    },
  );
  const response = await request(app)
    .post(`${API}/bookings/${reference}/payment/simulate`)
    .set("x-booking-token", manageToken);
  expect(response.status).toBe(500);
  const result = await pool.query(
    `SELECT status,(SELECT count(*)::int FROM payments WHERE booking_id=b.id) AS payments
    FROM bookings b WHERE reference=$1`,
    [reference],
  );
  expect(result.rows[0]).toEqual({ status: "held", payments: 0 });
});

it("creates payment, approval, modification and cancellation notifications for the guest email", async () => {
  const user = await createUser("notify@test.example");
  const other = await createUser("other@test.example");
  const admin = await createUser("admin@test.example", "admin");
  const created = await request(app)
    .post(`${API}/bookings`)
    .send({
      branchSlug: "polokwane",
      roomType: "classic",
      checkIn: daysFromToday(50),
      checkOut: daysFromToday(52),
      guests: 2,
      rooms: 1,
      guestName: "Notify Guest",
      guestEmail: "NOTIFY@test.example",
      guestPhone: "0821234567",
    });
  const { reference, manageToken } = created.body.data;
  expect(
    (
      await request(app)
        .post(`${API}/bookings/${reference}/payment/simulate`)
        .set("x-booking-token", manageToken)
    ).status,
  ).toBe(200);
  const adminPath = `${API}/admin/bookings/${reference}`;
  expect(
    (
      await request(app)
        .post(`${adminPath}/approve`)
        .set("authorization", `Bearer ${admin.token}`)
    ).status,
  ).toBe(200);
  expect(
    (
      await request(app)
        .patch(adminPath)
        .set("authorization", `Bearer ${admin.token}`)
        .send({ checkOut: daysFromToday(53) })
    ).status,
  ).toBe(200);
  expect(
    (
      await request(app)
        .post(`${API}/bookings/${reference}/cancel`)
        .set("x-booking-token", manageToken)
    ).status,
  ).toBe(200);
  const list = await request(app)
    .get(`${API}/me/notifications`)
    .set("authorization", `Bearer ${user.token}`);
  expect(list.status).toBe(200);
  expect(list.body.data.map((n: { type: string }) => n.type).sort()).toEqual([
    "approval",
    "cancellation",
    "modification",
    "payment",
  ]);
  const id = list.body.data[0].id;
  expect(
    (
      await request(app)
        .get(`${API}/me/notifications`)
        .set("authorization", `Bearer ${other.token}`)
    ).body.data,
  ).toEqual([]);
  expect(
    (
      await request(app)
        .patch(`${API}/me/notifications/${id}/read`)
        .set("authorization", `Bearer ${other.token}`)
    ).status,
  ).toBe(404);
  for (let attempt = 0; attempt < 2; attempt++) {
    const read = await request(app)
      .patch(`${API}/me/notifications/${id}/read`)
      .set("authorization", `Bearer ${user.token}`);
    expect(read.status).toBe(200);
    expect(read.body.data.isRead).toBe(true);
  }
});
