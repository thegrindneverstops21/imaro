import request from "supertest";
import { afterEach, afterAll, describe, expect, it } from "vitest";
import { app } from "../../src/app";
import { pool } from "../../src/db/pool";
import { API, createBooking, daysFromToday, holdRoom, removeTestBookings } from "../helpers";

const checkIn = daysFromToday(20);
const checkOut = daysFromToday(22);
const stayQuery = `checkIn=${checkIn}&checkOut=${checkOut}`;
const get = (path: string) => request(app).get(`${API}${path}`);

afterEach(removeTestBookings);
afterAll(() => pool.end());

describe("health", () => {
  it("reports ok when the database answers", async () => {
    const res = await get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GET /branches", () => {
  it("lists the three branches with a from-price", async () => {
    const res = await get("/branches");
    expect(res.status).toBe(200);
    expect(res.body.data.map((b: { slug: string }) => b.slug)).toEqual(["polokwane", "pretoria", "sandton"]);
    expect(res.body.data[0]).toMatchObject({ name: "Stillmere Polokwane", fromPrice: 1250 });
  });

  it("filters by price range", async () => {
    const cheap = await get("/branches?maxPrice=1300");
    const premium = await get("/branches?minPrice=2300");
    expect(cheap.body.data.map((b: { slug: string }) => b.slug)).toEqual(["polokwane"]);
    expect(premium.body.data.map((b: { slug: string }) => b.slug)).toEqual(["sandton"]);
  });

  it("filters by city and room type", async () => {
    const city = await get("/branches?city=pretoria");
    const suites = await get("/branches?roomType=suite&maxPrice=2100");
    expect(city.body.data).toHaveLength(1);
    expect(suites.body.data.map((b: { slug: string }) => b.slug)).toEqual(["polokwane"]);
  });

  it("drops a branch once every room of the requested type is held", async () => {
    const id = await createBooking("TEST-SUITES", checkIn, checkOut);
    await holdRoom(id, "301", checkIn, checkOut);
    await holdRoom(id, "302", checkIn, checkOut);

    const res = await get(`/branches?roomType=suite&${stayQuery}`);
    expect(res.body.data.map((b: { slug: string }) => b.slug)).toEqual(["pretoria", "sandton"]);
  });

  it("rejects invalid filters with a 400", async () => {
    const res = await get("/branches?guests=0");
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Validation failed");
  });
});

describe("GET /branches/:slug", () => {
  it("returns the full branch page data", async () => {
    const res = await get("/branches/polokwane");
    const { data } = res.body;
    expect(res.status).toBe(200);
    expect(data).toMatchObject({ slug: "polokwane", checkInTime: "14:00", checkOutTime: "10:00" });
    expect(data.images.length).toBeGreaterThan(0);
    expect(data.amenities.length).toBeGreaterThan(0);
    expect(data.policies.map((p: { type: string }) => p.type)).toContain("cancellation");
    expect(data.roomTypes.map((t: { availableRooms: number }) => t.availableRooms)).toEqual([6, 4, 2]);
  });

  it("returns 404 with the standard error shape for an unknown branch", async () => {
    const res = await get("/branches/atlantis");
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe("Branch not found");
  });
});

describe("GET /branches/:slug/availability", () => {
  it("prices a two-night Classic stay like the Figma review screen", async () => {
    const res = await get(`/branches/polokwane/availability?${stayQuery}&guests=2`);
    const classic = res.body.data.roomTypes.find((t: { slug: string }) => t.slug === "classic");
    expect(res.body.data.nights).toBe(2);
    expect(classic).toMatchObject({ totalPrice: 2500, vatIncluded: 326.09, roomsNeeded: 1, canBook: true });
  });

  it("needs two Classic rooms for four guests", async () => {
    const res = await get(`/branches/polokwane/availability?${stayQuery}&guests=4`);
    const classic = res.body.data.roomTypes.find((t: { slug: string }) => t.slug === "classic");
    expect(classic).toMatchObject({ roomsNeeded: 2, totalPrice: 5000 });
  });

  it.each([
    ["missing dates", ""],
    ["reversed dates", `?checkIn=${checkOut}&checkOut=${checkIn}`],
    ["past check-in", `?checkIn=2020-01-01&checkOut=2020-01-03`],
  ])("returns 400 for %s", async (_label, query) => {
    const res = await get(`/branches/polokwane/availability${query}`);
    expect(res.status).toBe(400);
  });

  it("returns 404 for an unknown branch", async () => {
    const res = await get(`/branches/atlantis/availability?${stayQuery}`);
    expect(res.status).toBe(404);
  });
});

describe("double-booking protection", () => {
  const classicAvailable = async (query: string) => {
    const res = await get(`/branches/polokwane/availability?${query}`);
    return res.body.data.roomTypes[0].availableRooms as number;
  };

  it("removes a held room from availability for overlapping dates only", async () => {
    const id = await createBooking("TEST-HOLD", checkIn, checkOut);
    await holdRoom(id, "101", checkIn, checkOut);

    expect(await classicAvailable(stayQuery)).toBe(5);
    expect(await classicAvailable(`checkIn=${checkOut}&checkOut=${daysFromToday(24)}`)).toBe(6);
  });

  it("makes the database refuse an overlapping booking for the same room", async () => {
    const first = await createBooking("TEST-A", checkIn, checkOut);
    const second = await createBooking("TEST-B", checkIn, checkOut);
    await holdRoom(first, "101", checkIn, checkOut);

    await expect(holdRoom(second, "101", checkIn, checkOut)).rejects.toMatchObject({
      constraint: "no_double_booking",
    });
  });

  it("frees the room again when the booking becomes inactive", async () => {
    const id = await createBooking("TEST-FREE", checkIn, checkOut);
    await holdRoom(id, "101", checkIn, checkOut);
    await pool.query(`UPDATE booking_rooms SET active = false WHERE booking_id = $1`, [id]);

    expect(await classicAvailable(stayQuery)).toBe(6);
  });
});
