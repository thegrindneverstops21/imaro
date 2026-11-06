import request from "supertest";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../../.vscode/src/app";
import { pool } from "../../.vscode/src/db/pool";
import { API, createUser, daysFromToday, removeTestBookings } from "../helpers";

const TOKEN_HEADER = "x-booking-token";
const checkIn = daysFromToday(30);
const checkOut = daysFromToday(32);

// A valid booking request; `overrides` lets a test change one field to check the failure case (bad email, reversed dates, too many guests...).
const stay = (overrides: Record<string, unknown> = {}) => ({
  branchSlug: "polokwane",
  roomType: "classic",
  checkIn,
  checkOut,
  guests: 2,
  rooms: 1,
  guestName: "Naledi Mokoena",
  guestEmail: "Naledi@Test.example",
  guestPhone: "0821234567",
  ...overrides,
});

const book = (body: object, bearer?: string) => {
  const req = request(app).post(`${API}/bookings`);
  return (bearer ? req.set("authorization", `Bearer ${bearer}`) : req).send(
    body,
  );
};

async function created(overrides: Record<string, unknown> = {}) {
  const res = await book(stay(overrides));
  expect(res.status).toBe(201);
  return {
    reference: res.body.data.reference as string,
    token: res.body.data.manageToken as string,
  };
}

const view = (reference: string, token?: string) => {
  const req = request(app).get(`${API}/bookings/${reference}`);
  return token ? req.set(TOKEN_HEADER, token) : req;
};
const cancel = (reference: string, token: string) =>
  request(app)
    .post(`${API}/bookings/${reference}/cancel`)
    .set(TOKEN_HEADER, token);
const pay = (reference: string, token: string) =>
  request(app)
    .post(`${API}/bookings/${reference}/payment/simulate`)
    .set(TOKEN_HEADER, token);
// Asks the public API how many Classic rooms are free, so tests can assert that holding or cancelling a booking really changes availability.
const classicFree = async (from: string, to: string) => {
  const res = await request(app).get(
    `${API}/branches/polokwane/availability?checkIn=${from}&checkOut=${to}`,
  );
  return res.body.data.roomTypes[0].availableRooms as number;
};

afterEach(removeTestBookings);
afterAll(() => pool.end());

describe("POST /bookings", () => {
  it("holds a room and prices the stay on the server", async () => {
    const res = await book(stay());
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      status: "held",
      paymentStatus: "unpaid",
      totalAmount: 2500,
      vatIncluded: 326.09,
      currency: "ZAR",
      nights: 2,
      roomsBooked: 1,
    });
    expect(res.body.data.reference).toMatch(/^IM-[0-9A-F]{10}$/);
    expect(res.body.data.manageToken.length).toBeGreaterThan(30);
    expect(await classicFree(checkIn, checkOut)).toBe(5);
  });

  it("never stores the manage token, only its hash", async () => {
    const { reference, token } = await created();
    const { rows } = await pool.query(
      `SELECT access_token_hash FROM bookings WHERE reference = $1`,
      [reference],
    );
    expect(rows[0].access_token_hash).not.toBe(token);
    expect(rows[0].access_token_hash).toHaveLength(64);
  });

  it("needs two Classic rooms for four guests", async () => {
    const res = await book(stay({ guests: 4 }));
    expect(res.body.data).toMatchObject({ roomsBooked: 2, totalAmount: 5000 });
  });

  it("links the booking to a signed-in user", async () => {
    const user = await createUser("owner@test.example");
    const res = await book(stay(), user.token);
    const { rows } = await pool.query(
      `SELECT user_id FROM bookings WHERE reference = $1`,
      [res.body.data.reference],
    );
    expect(rows[0].user_id).toBe(user.id);
  });

  it.each([
    ["invalid email", { guestEmail: "nope" }],
    ["missing name", { guestName: "" }],
    ["reversed dates", { checkIn: checkOut, checkOut: checkIn }],
    ["past check-in", { checkIn: "2020-01-01", checkOut: "2020-01-03" }],
    ["too many guests", { guests: 11 }],
  ])("rejects %s with a 400", async (_label, overrides) => {
    expect((await book(stay(overrides))).status).toBe(400);
  });

  it("returns 404 for a room type the branch does not offer", async () => {
    const res = await book(stay({ roomType: "penthouse" }));
    expect(res.status).toBe(404);
  });

  it("returns 404 for an unknown branch", async () => {
    expect((await book(stay({ branchSlug: "atlantis" }))).status).toBe(404);
  });

  it("returns 409 when there are not enough free rooms", async () => {
    const res = await book(stay({ roomType: "suite", rooms: 3 }));
    expect(res.status).toBe(409);
  });

  it("lets exactly one of several simultaneous bookings take the last rooms", async () => {
    const body = stay({ roomType: "suite", guests: 4, rooms: 2 });
    const results = await Promise.all(
      Array.from({ length: 5 }, () => book(body)),
    );
    const statuses = results.map((res) => res.status).sort();
    expect(statuses).toEqual([201, 409, 409, 409, 409]);
  });
});

describe("hold expiry", () => {
  it("frees the rooms in search as soon as the hold lapses, without any sweep", async () => {
    const { reference } = await created({
      roomType: "suite",
      guests: 4,
      rooms: 2,
    });
    const suitesFree = async () => {
      const res = await request(app).get(
        `${API}/branches/polokwane/availability?checkIn=${checkIn}&checkOut=${checkOut}`,
      );
      return res.body.data.roomTypes.find(
        (t: { slug: string }) => t.slug === "suite",
      ).availableRooms;
    };
    expect(await suitesFree()).toBe(0);

    await pool.query(
      `UPDATE bookings SET hold_expires_at = now() - interval '1 minute' WHERE reference = $1`,
      [reference],
    );
    expect(await suitesFree()).toBe(2);
  });

  it("lets a new booking take the rooms of an expired hold", async () => {
    const { reference } = await created({
      roomType: "suite",
      guests: 4,
      rooms: 2,
    });
    await pool.query(
      `UPDATE bookings SET hold_expires_at = now() - interval '1 minute' WHERE reference = $1`,
      [reference],
    );

    expect(
      (await book(stay({ roomType: "suite", guests: 4, rooms: 2 }))).status,
    ).toBe(201);
    const { rows } = await pool.query(
      `SELECT status FROM bookings WHERE reference = $1`,
      [reference],
    );
    expect(rows[0].status).toBe("expired");
  });
});

describe("GET /bookings/:reference", () => {
  it("returns plain dates, numbers and camelCase fields", async () => {
    const { reference, token } = await created();
    const res = await view(reference, token);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      reference,
      checkIn,
      checkOut,
      nights: 2,
      totalAmount: 2500,
      vatIncluded: 326.09,
      branch: { slug: "polokwane", name: "Stillmere Polokwane" },
      guest: {
        name: "Naledi Mokoena",
        email: "naledi@test.example",
        phone: "0821234567",
      },
      rooms: [{ roomType: "Classic Room", rooms: 1, pricePerNight: 1250 }],
    });
    expect(res.body.data.cancellation).toMatchObject({
      freeCancellation: true,
      fee: 0,
    });
    expect(res.body.data).not.toHaveProperty("accessTokenHash");
  });

  it("looks identical for a wrong token, no token and an unknown reference", async () => {
    const { reference } = await created();
    const wrong = await view(reference, "wrong-token");
    const none = await view(reference);
    const unknown = await view("IM-DOESNOTEXIST", "wrong-token");
    expect([wrong.status, none.status, unknown.status]).toEqual([
      404, 404, 404,
    ]);
    expect(wrong.body).toEqual(unknown.body);
  });

  it("lets the signed-in owner in without the token", async () => {
    const user = await createUser("owner@test.example");
    const res = await book(stay(), user.token);
    const owner = await request(app)
      .get(`${API}/bookings/${res.body.data.reference}`)
      .set("authorization", `Bearer ${user.token}`);
    expect(owner.status).toBe(200);
    const stranger = await createUser("stranger@test.example");
    const denied = await request(app)
      .get(`${API}/bookings/${res.body.data.reference}`)
      .set("authorization", `Bearer ${stranger.token}`);
    expect(denied.status).toBe(404);
  });
});

describe("POST /bookings/:reference/cancel", () => {
  it("cancels for free and releases the rooms", async () => {
    const { reference, token } = await created();
    const res = await cancel(reference, token);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      status: "cancelled",
      cancellation: { freeCancellation: true, fee: 0 },
    });
    expect(await classicFree(checkIn, checkOut)).toBe(6);
  });

  it("refunds a paid booking in full inside the free window", async () => {
    const { reference, token } = await created();
    await pay(reference, token);
    const res = await cancel(reference, token);
    expect(res.body.data).toMatchObject({
      paymentStatus: "refunded",
      cancellation: { refund: 2500 },
    });
  });

  it("keeps the first night when cancelling after the deadline", async () => {
    const soon = daysFromToday(1);
    const { reference, token } = await created({
      checkIn: soon,
      checkOut: daysFromToday(3),
    });
    await pay(reference, token);
    const res = await cancel(reference, token);
    expect(res.body.data.cancellation).toMatchObject({
      freeCancellation: false,
      fee: 1250,
      refund: 1250,
    });
    expect(res.body.data.paymentStatus).toBe("refunded");
  });

  it("refuses to cancel twice", async () => {
    const { reference, token } = await created();
    await cancel(reference, token);
    expect((await cancel(reference, token)).status).toBe(409);
  });

  it("refuses to cancel a completed or already started stay", async () => {
    const { reference, token } = await created();
    await pool.query(
      `UPDATE bookings SET status = 'completed' WHERE reference = $1`,
      [reference],
    );
    expect((await cancel(reference, token)).status).toBe(409);
    await pool.query(
      `UPDATE bookings SET status = 'confirmed', check_in = current_date WHERE reference = $1`,
      [reference],
    );
    expect((await cancel(reference, token)).status).toBe(409);
  });

  it("returns 404 without the right token", async () => {
    const { reference } = await created();
    expect((await cancel(reference, "wrong")).status).toBe(404);
  });
});

describe("POST /bookings/:reference/payment/simulate", () => {
  it("marks the booking paid and sends it for admin approval", async () => {
    const { reference, token } = await created();
    const res = await pay(reference, token);
    expect(res.body.data).toMatchObject({
      status: "pending_approval",
      paymentStatus: "paid",
      simulated: true,
    });
    const { rows } = await pool.query(
      `SELECT p.provider, p.status, p.amount::float8 AS amount FROM payments p JOIN bookings b ON b.id = p.booking_id WHERE b.reference = $1`,
      [reference],
    );
    expect(rows).toEqual([
      { provider: "simulated", status: "complete", amount: 2500 },
    ]);
  });

  it("refuses once the hold has expired", async () => {
    const { reference, token } = await created();
    await pool.query(
      `UPDATE bookings SET hold_expires_at = now() - interval '1 minute' WHERE reference = $1`,
      [reference],
    );
    expect((await pay(reference, token)).status).toBe(409);
  });

  it("refuses to pay twice", async () => {
    const { reference, token } = await created();
    await pay(reference, token);
    expect((await pay(reference, token)).status).toBe(409);
  });

  it("does not exist in production", async () => {
    vi.resetModules();
    vi.doMock("../../src/config/env", async (importOriginal) => {
      const actual =
        await importOriginal<typeof import("../../.vscode/src/config/env")>();
      return { env: { ...actual.env, NODE_ENV: "production" } };
    });
    const { simulatePayment } =
      await import("../../.vscode/src/services/bookingService.js");
    await expect(
      simulatePayment("IM-ANY", { token: "x", userId: null }),
    ).rejects.toMatchObject({
      status: 404,
      message: "Route not found",
    });
    vi.doUnmock("../../src/config/env");
  });
});

describe("booking payment balances", () => {
  it("exposes actual payments and the remaining balance after an admin extends a paid stay", async () => {
    const { reference, token } = await created();
    const before = await view(reference, token);
    expect(before.body.data).toMatchObject({ amountPaid: 0, balanceDue: 2500 });
    await pay(reference, token);
    expect((await view(reference, token)).body.data).toMatchObject({
      amountPaid: 2500,
      balanceDue: 0,
    });
    const admin = await createUser("balance-admin@test.example", "admin");
    const changed = await request(app)
      .patch(`${API}/admin/bookings/${reference}`)
      .set("authorization", `Bearer ${admin.token}`)
      .send({ checkOut: daysFromToday(35) });
    expect(changed.status).toBe(200);
    expect(changed.body.data).toMatchObject({
      totalAmount: 6250,
      amountPaid: 2500,
      balanceDue: 3750,
    });
    expect((await view(reference, token)).body.data).toMatchObject({
      totalAmount: 6250,
      amountPaid: 2500,
      balanceDue: 3750,
    });
    const shorter = await request(app)
      .patch(`${API}/admin/bookings/${reference}`)
      .set("authorization", `Bearer ${admin.token}`)
      .send({ checkOut: daysFromToday(31) });
    expect(shorter.body.data).toMatchObject({
      totalAmount: 1250,
      amountPaid: 2500,
      balanceDue: -1250,
    });
  });
});
