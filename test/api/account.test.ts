import request from "supertest";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { app } from "../../backend/src/app";
import { pool } from "../../backend/src/db/pool";
import { hashToken } from "../../backend/src/utils/secrets";
import {
  API,
  createBooking,
  createUser,
  daysFromToday,
  removeTestBookings,
} from "../helpers";

afterEach(removeTestBookings);
afterAll(() => pool.end());
const auth = (token: string) => ({ authorization: `Bearer ${token}` });

describe("account profile and history", () => {
  it("requires sign-in and allows only name and phone updates", async () => {
    expect((await request(app).get(`${API}/me`)).status).toBe(401);
    const user = await createUser("profile@test.example");
    const response = await request(app)
      .patch(`${API}/me`)
      .set(auth(user.token))
      .send({ name: "New Name", phone: "0821234567" });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      name: "New Name",
      phone: "0821234567",
      email: "profile@test.example",
    });
    expect(
      (
        await request(app)
          .patch(`${API}/me`)
          .set(auth(user.token))
          .send({ role: "admin" })
      ).status,
    ).toBe(400);
    expect(
      (await request(app).get(`${API}/me`).set(auth(user.token))).body.data
        .name,
    ).toBe("New Name");
  });
  it("lists bookings by user or case-insensitive email without leaking other bookings", async () => {
    const user = await createUser("history@test.example");
    await createBooking("TEST-OWN", daysFromToday(10), daysFromToday(11));
    await createBooking("TEST-EMAIL", daysFromToday(12), daysFromToday(13));
    await createBooking("TEST-OTHER", daysFromToday(14), daysFromToday(15));
    await pool.query(
      "UPDATE bookings SET user_id=$1 WHERE reference='TEST-OWN'",
      [user.id],
    );
    await pool.query(
      "UPDATE bookings SET guest_email='HISTORY@Test.example' WHERE reference='TEST-EMAIL'",
    );
    const response = await request(app)
      .get(`${API}/me/bookings`)
      .set(auth(user.token));
    expect(response.status).toBe(200);
    expect(
      response.body.data.map((b: { reference: string }) => b.reference).sort(),
    ).toEqual(["TEST-EMAIL", "TEST-OWN"]);
    expect(JSON.stringify(response.body)).not.toContain("accessTokenHash");
  });
});

describe("favourites", () => {
  it("saves and removes idempotently, scopes users, and decorates branches", async () => {
    const user = await createUser("favourite@test.example");
    const other = await createUser("other@test.example");
    const path = `${API}/me/favourites/polokwane`;
    expect((await request(app).put(path)).status).toBe(401);
    for (let attempt = 0; attempt < 2; attempt++)
      expect((await request(app).put(path).set(auth(user.token))).status).toBe(
        200,
      );
    const saved = await request(app)
      .get(`${API}/me/favourites`)
      .set(auth(user.token));
    expect(saved.body.data).toHaveLength(1);
    expect(saved.body.data[0].slug).toBe("polokwane");
    expect(
      (await request(app).get(`${API}/me/favourites`).set(auth(other.token)))
        .body.data,
    ).toEqual([]);
    expect(
      (
        await request(app)
          .get(`${API}/branches/polokwane`)
          .set(auth(user.token))
      ).body.data.isFavourite,
    ).toBe(true);
    const branches = await request(app)
      .get(`${API}/branches`)
      .set(auth(user.token));
    expect(
      branches.body.data.find((b: { slug: string }) => b.slug === "polokwane")
        .isFavourite,
    ).toBe(true);
    expect(
      (
        await request(app)
          .put(`${API}/me/favourites/missing`)
          .set(auth(user.token))
      ).status,
    ).toBe(404);
    for (let attempt = 0; attempt < 2; attempt++)
      expect(
        (await request(app).delete(path).set(auth(user.token))).status,
      ).toBe(200);
    expect(
      (await request(app).get(`${API}/me/favourites`).set(auth(user.token)))
        .body.data,
    ).toEqual([]);
  });
});

describe("reviews", () => {
  it("accepts a manage token after checkout and validates comment length", async () => {
    const id = await createBooking(
      "TEST-TOKEN-REVIEW",
      daysFromToday(-4),
      daysFromToday(-2),
    );
    await pool.query(
      "UPDATE bookings SET access_token_hash=$1,status='completed' WHERE id=$2",
      [hashToken("private-test-token"), id],
    );
    const post = (comment: string) =>
      request(app)
        .post(`${API}/bookings/TEST-TOKEN-REVIEW/review`)
        .set("x-booking-token", "private-test-token")
        .send({ rating: 4, comment });
    expect((await post("a".repeat(1001))).status).toBe(400);
    expect((await post("Lovely stay")).status).toBe(201);
    expect(
      (await request(app).get(`${API}/branches/missing/reviews`)).status,
    ).toBe(404);
    expect(
      (await request(app).get(`${API}/branches/polokwane/reviews?limit=0`))
        .status,
    ).toBe(400);
  });
  it("requires an authorized completed stay, prevents duplicates, and publishes first name only", async () => {
    const user = await createUser("review@test.example");
    const id = await createBooking(
      "TEST-REVIEW",
      daysFromToday(-4),
      daysFromToday(-2),
    );
    await pool.query(
      "UPDATE bookings SET user_id=$1,status='confirmed' WHERE id=$2",
      [user.id, id],
    );
    const path = `${API}/bookings/TEST-REVIEW/review`;
    expect((await request(app).post(path).send({ rating: 5 })).status).toBe(
      404,
    );
    expect(
      (await request(app).post(path).set(auth(user.token)).send({ rating: 6 }))
        .status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post(path)
          .set(auth(user.token))
          .send({ rating: 5, comment: "Excellent" })
      ).status,
    ).toBe(201);
    expect(
      (await request(app).post(path).set(auth(user.token)).send({ rating: 4 }))
        .status,
    ).toBe(409);
    const reviews = await request(app).get(
      `${API}/branches/polokwane/reviews?limit=1&offset=0`,
    );
    expect(reviews.status).toBe(200);
    expect(reviews.body.meta).toEqual({ total: 1, limit: 1, offset: 0 });
    expect(reviews.body.data[0]).toMatchObject({
      firstName: "Test",
      rating: 5,
      comment: "Excellent",
    });
    expect(JSON.stringify(reviews.body)).not.toMatch(/email|Guest|TEST-REVIEW/);
    const branch = await request(app).get(`${API}/branches/polokwane`);
    expect(branch.body.data).toMatchObject({
      ratingAverage: 5,
      reviewCount: 1,
    });
    const empty = await request(app).get(
      `${API}/branches/polokwane/reviews?offset=99`,
    );
    expect(empty.body.data).toEqual([]);
    expect(empty.body.meta.total).toBe(1);
  });
  it("rejects checkout today and invalid status", async () => {
    const user = await createUser("early@test.example");
    const id = await createBooking(
      "TEST-EARLY",
      daysFromToday(-1),
      daysFromToday(0),
    );
    await pool.query(
      "UPDATE bookings SET user_id=$1,status='confirmed' WHERE id=$2",
      [user.id, id],
    );
    const post = () =>
      request(app)
        .post(`${API}/bookings/TEST-EARLY/review`)
        .set(auth(user.token))
        .send({ rating: 3 });
    expect((await post()).status).toBe(409);
    await pool.query(
      "UPDATE bookings SET check_in=current_date-3,check_out=current_date-2,status='cancelled' WHERE id=$1",
      [id],
    );
    expect((await post()).status).toBe(409);
  });
});
