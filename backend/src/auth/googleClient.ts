import { z } from "zod";
import { env } from "../config/env";
import { HttpStatus } from "../constants/http";
import { ErrorMessage } from "../constants/messages";
import type { GoogleProfile } from "../domain/authTypes";
import { AppError } from "../middleware/error";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const SCOPES = "openid email profile";
const FORM_HEADERS = { "content-type": "application/x-www-form-urlencoded" };

const tokenSchema = z.object({ access_token: z.string().min(1) });
const profileSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  verified_email: z.boolean().optional(),
});

const signInFailed = () =>
  new AppError(HttpStatus.Unauthorized, ErrorMessage.GoogleSignInFailed);

// Sign-in is optional in development: if the keys are missing we fail with a clear message instead of crashing the whole server.
function googleConfig() {
  const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret } =
    env;
  if (!clientId || !clientSecret)
    throw new AppError(HttpStatus.BadRequest, ErrorMessage.GoogleNotConfigured);
  return { clientId, clientSecret, redirectUri: env.GOOGLE_REDIRECT_URI };
}

export function authorizationUrl(state: string): string {
  const { clientId, redirectUri } = googleConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    state,
    prompt: "select_account",
  });
  return `${AUTH_URL}?${params.toString()}`;
}

// The code is exchanged server-to-server so the client secret never reaches the browser.
async function exchangeCode(code: string): Promise<string> {
  const { clientId, clientSecret, redirectUri } = googleConfig();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: FORM_HEADERS,
    body,
  });
  const tokens = tokenSchema.safeParse(
    response.ok ? await response.json() : null,
  );
  if (!tokens.success) throw signInFailed();
  return tokens.data.access_token;
}

// Google's answer is untrusted input, so validate it with Zod before using it.
async function readProfile(accessToken: string): Promise<GoogleProfile> {
  const response = await fetch(USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const profile = profileSchema.safeParse(
    response.ok ? await response.json() : null,
  );
  if (!profile.success) throw signInFailed();
  if (profile.data.verified_email === false) {
    throw new AppError(
      HttpStatus.Unauthorized,
      ErrorMessage.GoogleEmailUnverified,
    );
  }
  const { id, email, name } = profile.data;
  return { googleId: id, email, name };
}

export async function fetchGoogleProfile(code: string): Promise<GoogleProfile> {
  return readProfile(await exchangeCode(code));
}
