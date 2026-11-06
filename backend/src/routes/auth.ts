import { Router } from "express";
import { authorizationUrl } from "../auth/googleClient";
import { createOAuthState, isValidOAuthState } from "../auth/oauthState";
import { env } from "../config/env";
import { Environment } from "../constants/domain";
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
  requestPasswordReset,
  resetPassword,
} from "../services/authService";
import {
  passwordResetBody,
  passwordResetRequestBody,
  registerBody,
  signInBody,
} from "../validation/auth";
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

authRouter.post("/password-reset/request", async (req, res) => {
  const { email } = passwordResetRequestBody.parse(req.body);
  const token = await requestPasswordReset(email);
  const data: { message: string; resetToken?: string } = {
    message: "If an account exists, password reset instructions are ready.",
  };
  if (token && env.NODE_ENV !== Environment.Production) data.resetToken = token;
  res.json({ data });
});

authRouter.post("/password-reset/complete", async (req, res) => {
  const input = passwordResetBody.parse(req.body);
  await resetPassword(input.token, input.password);
  res.json({ data: { message: "Password updated. You can now sign in." } });
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
