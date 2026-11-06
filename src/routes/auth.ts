import { Router } from "express";
import { authorizationUrl } from "../auth/googleClient";
import { createOAuthState, isValidOAuthState } from "../auth/oauthState";
import { env } from "../config/env";
import { LOGIN_FAILURE_PATH, LOGIN_SUCCESS_PATH } from "../constants/domain";
import { HttpStatus } from "../constants/http";
import { ErrorMessage } from "../constants/messages";
import { currentSession, requireUser } from "../middleware/auth";
import { AppError, toFailure } from "../middleware/error";
import { findUserById } from "../repositories/userRepository";
import {
  registerWithPassword,
  sessionTokenFor,
  signInWithGoogle,
  signInWithPassword,
} from "../services/authService";
import { registerBody, signInBody } from "../validation/auth";
import { oauthCallbackQuery } from "../validation/booking";

export const authRouter = Router();

// Builds a frontend URL from our CLIENT_URL setting.

const clientUrl = (path: string): string => `${env.CLIENT_URL}${path}`;

// Email and password: the API creates the account (or checks it) and returns the same session token Google sign-in uses.
authRouter.post("/register", async (req, res) => {
  const user = await registerWithPassword(registerBody.parse(req.body));
  res
    .status(HttpStatus.Created)
    .json({ data: { token: sessionTokenFor(user), user } });
});

authRouter.post("/login", async (req, res) => {
  const input = signInBody.parse(req.body);
  const user = await signInWithPassword(input.email, input.password);
  res.json({ data: { token: sessionTokenFor(user), user } });
});

// Step 1: the app asks for the Google sign-in address and sends the browser there.
authRouter.get("/google", (_req, res) => {
  res.json({
    data: { authorizationUrl: authorizationUrl(createOAuthState()) },
  });
});

async function completeSignIn(query: unknown): Promise<string> {
  const { code, state } = oauthCallbackQuery.parse(query);
  if (!isValidOAuthState(state))
    throw new AppError(HttpStatus.Unauthorized, ErrorMessage.InvalidOAuthState);
  return sessionTokenFor(await signInWithGoogle(code));
}

// Step 2: Google sends the browser back here. The token goes to the app in the URL fragment, which browsers never send to servers or write to logs.
authRouter.get("/google/callback", async (req, res) => {
  try {
    const token = await completeSignIn(req.query);
    res.redirect(clientUrl(`${LOGIN_SUCCESS_PATH}#token=${token}`));
  } catch (error) {
    const failure = toFailure(error);
    if (failure.status === HttpStatus.InternalServerError) console.error(error);
    res.redirect(
      clientUrl(
        `${LOGIN_FAILURE_PATH}?error=${encodeURIComponent(failure.message)}`,
      ),
    );
  }
});

authRouter.get("/me", requireUser, async (_req, res) => {
  res.json({ data: await findUserById(currentSession(res).userId) });
});
