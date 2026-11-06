import request from "supertest";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { app } from "../../backend/src/app";
import { env } from "../../backend/src/config/env";
import { pool } from "../../backend/src/db/pool";
import { signature } from "../../backend/src/domain/payfast";
import * as gateway from "../../backend/src/services/payfastGateway";
import * as payments from "../../backend/src/repositories/paymentRepository";
import { API, createUser, daysFromToday, removeTestBookings } from "../helpers";

beforeEach(() => {
  Object.assign(env, {
    PAYFAST_MERCHANT_ID: "10000100",
    PAYFAST_MERCHANT_KEY: "test-key",
    PAYFAST_PASSPHRASE: "test-pass",
    PAYFAST_SANDBOX: true,
    PAYFAST_NOTIFY_URL: "https://example.com/notify",
    PAYFAST_RETURN_URL: "https://example.com/return",
    PAYFAST_CANCEL_URL: "https://example.com/cancel",
  });
  vi.spyOn(gateway, "verifyWithPayfast").mockResolvedValue(true);
});
afterEach(async () => {
  vi.restoreAllMocks();
  await removeTestBookings();
});
afterAll(() => pool.end());

async function hold() {
  const response = await request(app)
    .post(`${API}/bookings`)
    .send({
      branchSlug: "polokwane",
      roomType: "classic",
      checkIn: daysFromToday(40),
      checkOut: daysFromToday(42),
      guests: 2,
      rooms: 1,
      guestName: "Payment Guest",
      guestEmail: "payment@test.example",
      guestPhone: "0821234567",
    });
  expect(response.status).toBe(201);
  return response.body.data;
}
function payload(reference: string, overrides = {}) {
  const fields = {
    m_payment_id: reference,
    pf_payment_id: "PF-TEST",
    payment_status: "COMPLETE",
    amount_gross: "2500.00",
    merchant_id: "10000100",
    ...overrides,
  };
  return { ...fields, signature: signature(fields, "test-pass") };
}
const notify = (body: object) =>
  request(app).post(`${API}/payments/payfast/notify`).type("form").send(body);
async function state(reference: string) {
  const result = await pool.query(
    `SELECT status, payment_status, hold_expires_at,
    (SELECT count(*)::int FROM payments WHERE booking_id=b.id) AS payments FROM bookings b WHERE reference=$1`,
    [reference],
  );
  return result.rows[0];
}

describe("PayFast checkout and ITN", () => {
  it("acknowledges malformed notification bodies without changing data", async () => {
    expect(
      (
        await request(app)
          .post(`${API}/payments/payfast/notify`)
          .set("Content-Type", "application/json")
          .send("{")
      ).status,
    ).toBe(200);
    expect(
      (await notify({ m_payment_id: ["invalid", "duplicate"] })).status,
    ).toBe(200);
  });
  it("allows the owner and keeps simulation unavailable in production", async () => {
    const booking = await hold();
    const user = await createUser("owner@test.example");
    await pool.query("UPDATE bookings SET user_id=$1 WHERE reference=$2", [
      user.id,
      booking.reference,
    ]);
    const path = `${API}/bookings/${booking.reference}/payment`;
    expect(
      (
        await request(app)
          .post(path)
          .set("authorization", `Bearer ${user.token}`)
      ).status,
    ).toBe(200);
    const original = env.NODE_ENV;
    try {
      env.NODE_ENV = "production";
      expect(
        (
          await request(app)
            .post(`${path}/simulate`)
            .set("x-booking-token", booking.manageToken)
        ).status,
      ).toBe(404);
    } finally {
      env.NODE_ENV = original;
    }
  });
  it("rolls back the status update if inserting the ledger row fails", async () => {
    const booking = await hold();
    vi.spyOn(payments, "insertPayment").mockImplementation(async (db) => {
      await db.query("SELECT 1/0");
    });
    expect((await notify(payload(booking.reference))).status).toBe(200);
    expect(await state(booking.reference)).toMatchObject({
      status: "held",
      payment_status: "unpaid",
      payments: 0,
    });
  });
  it("rejects reuse of a provider reference for a different booking", async () => {
    const first = await hold();
    const second = await hold();
    await notify(payload(first.reference));
    await notify(payload(second.reference));
    expect(await state(first.reference)).toMatchObject({ payments: 1 });
    expect(await state(second.reference)).toMatchObject({
      status: "held",
      payments: 0,
    });
  });
  it("returns signed checkout fields only to an authorized live hold", async () => {
    const booking = await hold();
    const path = `${API}/bookings/${booking.reference}/payment`;
    expect((await request(app).post(path)).status).toBe(404);
    const response = await request(app)
      .post(path)
      .set("x-booking-token", booking.manageToken);
    expect(response.status).toBe(200);
    expect(response.body.data.actionUrl).toBe(
      "https://sandbox.payfast.co.za/eng/process",
    );
    expect(response.body.data.fields).toMatchObject({
      m_payment_id: booking.reference,
      amount: "2500.00",
      name_first: "Payment",
      name_last: "Guest",
    });
    expect(response.body.data.fields.signature).toBe(
      signature(response.body.data.fields, "test-pass"),
    );
    await pool.query(
      "UPDATE bookings SET hold_expires_at=now()-interval '1 minute' WHERE reference=$1",
      [booking.reference],
    );
    expect(
      (
        await request(app)
          .post(path)
          .set("x-booking-token", booking.manageToken)
      ).status,
    ).toBe(409);
  });
  it("commits a verified payment once, including concurrent duplicate deliveries", async () => {
    const booking = await hold();
    const replies = await Promise.all([
      notify(payload(booking.reference)),
      notify(payload(booking.reference)),
    ]);
    expect(replies.map((reply) => reply.status)).toEqual([200, 200]);
    expect(await state(booking.reference)).toEqual({
      status: "pending_approval",
      payment_status: "paid",
      hold_expires_at: null,
      payments: 1,
    });
    const notifications = await pool.query(
      "SELECT type FROM notifications WHERE booking_id=(SELECT id FROM bookings WHERE reference=$1)",
      [booking.reference],
    );
    expect(notifications.rows).toEqual([{ type: "payment" }]);
    const payment = await pool.query(
      "SELECT provider,provider_ref,amount::float8,status FROM payments",
    );
    expect(payment.rows).toContainEqual({
      provider: "payfast",
      provider_ref: "PF-TEST",
      amount: 2500,
      status: "complete",
    });
  });
  it.each([
    { amount_gross: "1.00" },
    { payment_status: "FAILED" },
    { merchant_id: "other" },
    { signature: "invalid" },
  ])("ignores invalid ITNs: %j", async (override) => {
    const booking = await hold();
    const body = payload(booking.reference, override);
    if (override.signature) body.signature = override.signature;
    expect((await notify(body)).status).toBe(200);
    expect(await state(booking.reference)).toMatchObject({
      status: "held",
      payment_status: "unpaid",
      payments: 0,
    });
  });
  it("ignores failed server verification and network errors", async () => {
    const booking = await hold();
    vi.mocked(gateway.verifyWithPayfast)
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error("offline"));
    expect((await notify(payload(booking.reference))).status).toBe(200);
    expect((await notify(payload(booking.reference))).status).toBe(200);
    expect(await state(booking.reference)).toMatchObject({
      status: "held",
      payments: 0,
    });
  });
  it("does not revive an expired hold", async () => {
    const booking = await hold();
    await pool.query(
      "UPDATE bookings SET hold_expires_at=now()-interval '1 minute' WHERE reference=$1",
      [booking.reference],
    );
    expect((await notify(payload(booking.reference))).status).toBe(200);
    expect(await state(booking.reference)).toMatchObject({
      status: "held",
      payments: 0,
    });
  });
});
