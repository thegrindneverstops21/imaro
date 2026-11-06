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
import { createOAuthState } from "../../backend/src/auth/oauthState";
import { decodeSession } from "../../backend/src/auth/session";
import { env } from "../../backend/src/config/env";
import { pool } from "../../backend/src/db/pool";
import { API, createUser, removeTestBookings } from "../helpers";

const CALLBACK = `${API}/auth/google/callback`;

const jsonResponse = (body: unknown, ok = true) =>
  ({ ok, json: async () => body }) as Response;

// Pretends to be Google: first call is the token exchange, second is the profile lookup. `mockResolvedValueOnce` queues one canned answer per call, in order.
function stubGoogle(profile: Record<string, unknown>, tokenOk = true) {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      jsonResponse({ access_token: "google-access-token" }, tokenOk),
    )
    .mockResolvedValueOnce(jsonResponse(profile));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const profile = (email: string, extra: Record<string, unknown> = {}) => ({
  id: `google-${email}`,
  email,
  name: "Test Person",
  verified_email: true,
  ...extra,
});

const callback = (state = createOAuthState()) =>
  request(app).get(`${CALLBACK}?code=abc&state=${encodeURIComponent(state)}`);
const locationOf = (res: request.Response): string =>
  String(res.headers.location);
const tokenFrom = (location: string) =>
  new URL(location).hash.replace("#token=", "");

beforeEach(() => vi.unstubAllGlobals());
afterEach(removeTestBookings);
afterAll(() => pool.end());

describe("GET /auth/google", () => {
  it("returns a Google address carrying a signed state", async () => {
    const res = await request(app).get(`${API}/auth/google`);
    const url = new URL(res.body.data.authorizationUrl);
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("client_id")).toBe("test-google-client-id");
    expect(url.searchParams.get("state")).toBeTruthy();
  });
});

describe("POST /auth/login", () => {
  it("signs in the seeded administrator with the documented password", async () => {
    const res = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: "admin@imaro.local", password: "ImaroAdmin2026!" });

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({
      email: "admin@imaro.local",
      role: "admin",
    });
    expect(decodeSession(res.body.data.token)).toMatchObject({
      email: "admin@imaro.local",
      role: "admin",
    });
  });
});

describe("GET /auth/google/callback", () => {
  it("signs a new guest in and hands the token to the app in the URL fragment", async () => {
    stubGoogle(profile("new@test.example"));
    const res = await callback();

    expect(res.status).toBe(302);
    expect(locationOf(res)).toMatch(`${env.CLIENT_URL}/auth/callback#token=`);
    const session = decodeSession(tokenFrom(locationOf(res)));
    expect(session).toMatchObject({ email: "new@test.example", role: "guest" });
    const { rows } = await pool.query(
      `SELECT role, google_id FROM users WHERE email = 'new@test.example'`,
    );
    expect(rows[0]).toEqual({
      role: "guest",
      google_id: "google-new@test.example",
    });
  });

  it("makes people in ADMIN_EMAILS admins, whatever the capitalisation", async () => {
    stubGoogle(profile("Admin@Test.example"));
    const res = await callback();
    expect(decodeSession(tokenFrom(locationOf(res)))?.role).toBe("admin");
  });

  it("signing in again reuses the account and never removes admin rights", async () => {
    await createUser("again@test.example", "admin");
    stubGoogle(profile("again@test.example"));
    const res = await callback();
    expect(decodeSession(tokenFrom(locationOf(res)))?.role).toBe("admin");
    const { rows } = await pool.query(
      `SELECT count(*)::int AS n FROM users WHERE email = 'again@test.example'`,
    );
    expect(rows[0].n).toBe(1);
  });

  it("works end to end: the issued token opens /auth/me", async () => {
    stubGoogle(profile("me@test.example"));
    const token = tokenFrom(locationOf(await callback()));
    const me = await request(app)
      .get(`${API}/auth/me`)
      .set("authorization", `Bearer ${token}`);
    expect(me.body.data).toMatchObject({
      email: "me@test.example",
      role: "guest",
    });
  });

  it.each([
    ["a forged state", "1.2.3"],
    ["an expired state", createOAuthState(Date.now() - 11 * 60_000)],
  ])(
    "redirects to the login page with an error for %s",
    async (_label, state) => {
      const fetchMock = stubGoogle(profile("x@test.example"));
      const res = await callback(state);
      expect(locationOf(res)).toContain(`${env.CLIENT_URL}/login?error=`);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("redirects with an error when Google rejects the code", async () => {
    stubGoogle(profile("x@test.example"), false);
    const res = await callback();
    expect(locationOf(res)).toContain("/login?error=Google%20sign-in%20failed");
  });

  it("refuses an unverified Google email", async () => {
    stubGoogle(profile("unverified@test.example", { verified_email: false }));
    const res = await callback();
    expect(locationOf(res)).toContain("/login?error=");
    const { rows } = await pool.query(
      `SELECT 1 FROM users WHERE email = 'unverified@test.example'`,
    );
    expect(rows).toHaveLength(0);
  });

  it("redirects with an error when code or state is missing", async () => {
    const res = await request(app).get(CALLBACK);
    expect(locationOf(res)).toContain("/login?error=Validation%20failed");
  });
});

describe("GET /auth/me", () => {
  it("returns 401 without a session and 401 for a forged one", async () => {
    expect((await request(app).get(`${API}/auth/me`)).status).toBe(401);
    const forged = await request(app)
      .get(`${API}/auth/me`)
      .set("authorization", "Bearer e30.fake");
    expect(forged.status).toBe(401);
  });

  it("returns the signed-in user", async () => {
    const user = await createUser("profile@test.example");
    const res = await request(app)
      .get(`${API}/auth/me`)
      .set("authorization", `Bearer ${user.token}`);
    expect(res.body.data).toMatchObject({
      id: user.id,
      email: "profile@test.example",
    });
  });
});
