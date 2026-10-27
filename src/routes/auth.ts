import { randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { HttpStatus } from "../constants/http";
import { rows } from "../db/pool";
import { encodeSession, signState, verifyState } from "../middleware/auth";
import { AppError } from "../middleware/error";

/* eslint-disable @typescript-eslint/no-magic-numbers -- Express/Google OAuth time units are defined below. */

export const authRouter = Router();
const OAUTH_STATE_BYTES = 18;
const OAUTH_STATE_LIFETIME_MS = 10 * 60 * 1000;
const SESSION_LIFETIME_SECONDS = 7 * 24 * 60 * 60;
const SECONDS_PER_MILLISECOND = 1000;
const googleConfigured = (): boolean => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

authRouter.get("/google", (_req, res) => {
  if (!googleConfigured()) throw new AppError(HttpStatus.BadRequest, "Google sign-in is not configured");
  const payload = `${Date.now()}.${randomBytes(OAUTH_STATE_BYTES).toString("base64url")}`;
  const state = `${payload}.${signState(payload)}`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID!, redirect_uri: env.GOOGLE_REDIRECT_URI, response_type: "code", scope: "openid email profile", state, prompt: "select_account" }).toString();
  res.json({ data: { authorizationUrl: url.toString() } });
});

// eslint-disable-next-line complexity
authRouter.get("/google/callback", async (req, res) => {
  if (!googleConfigured()) throw new AppError(HttpStatus.BadRequest, "Google sign-in is not configured");
  const { code, state } = z.object({ code: z.string().min(1), state: z.string().min(1) }).parse(req.query);
  const [payload, signature] = state.split(/\.(?=[^.]+$)/);
  if (!payload || !signature || !verifyState(payload, signature)) throw new AppError(HttpStatus.Unauthorized, "Invalid OAuth state");
  const [issuedAt] = payload.split(".");
  if (!issuedAt || Math.abs(Date.now() - Number(issuedAt)) > OAUTH_STATE_LIFETIME_MS) throw new AppError(HttpStatus.Unauthorized, "OAuth state expired");
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID!, client_secret: env.GOOGLE_CLIENT_SECRET!, redirect_uri: env.GOOGLE_REDIRECT_URI, grant_type: "authorization_code" }) });
  if (!tokenResponse.ok) throw new AppError(HttpStatus.Unauthorized, "Google sign-in failed");
  const tokens = z.object({ access_token: z.string() }).parse(await tokenResponse.json());
  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { authorization: `Bearer ${tokens.access_token}` } });
  if (!profileResponse.ok) throw new AppError(HttpStatus.Unauthorized, "Could not read Google profile");
  const profile = z.object({ id: z.string(), email: z.string().email(), name: z.string().min(1), verified_email: z.boolean().optional() }).parse(await profileResponse.json());
  if (profile.verified_email === false) throw new AppError(HttpStatus.Unauthorized, "Google email is not verified");
  const admins = env.ADMIN_EMAILS.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  const role = admins.includes(profile.email.toLowerCase()) ? "admin" : "guest";
  const [user] = await rows<{ id: number; email: string; role: "guest" | "admin" }>(
    `INSERT INTO users (name, email, google_id, role) VALUES ($1, lower($2), $3, $4)
     ON CONFLICT (lower(email)) DO UPDATE SET name = EXCLUDED.name, google_id = EXCLUDED.google_id,
       role = CASE WHEN EXCLUDED.role = 'admin' THEN 'admin' ELSE users.role END
     RETURNING id, email, role`, [profile.name, profile.email, profile.id, role],
  );
  const sessionToken = encodeSession({ userId: user!.id, email: user!.email, role: user!.role, exp: Math.floor(Date.now() / SECONDS_PER_MILLISECOND) + SESSION_LIFETIME_SECONDS });
  res.json({ data: { token: sessionToken, user: { id: user!.id, email: user!.email, name: profile.name, role: user!.role } } });
});
