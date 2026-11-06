import { createHash, randomBytes } from "node:crypto";
import { encodeSession, newSession } from "../auth/session";
import { fetchGoogleProfile } from "../auth/googleClient";
import { hashPassword, passwordMatches } from "../auth/password";
import { env } from "../config/env";
import {
  PASSWORD_RESET_LIFETIME_MS,
  PASSWORD_RESET_TOKEN_BYTES,
  UserRole,
} from "../constants/domain";
import { HttpStatus } from "../constants/http";
import { ErrorMessage } from "../constants/messages";
import type { SessionUser } from "../domain/authTypes";
import { AppError } from "../middleware/error";
import { rows } from "../db/pool";
import * as resetRepo from "../repositories/passwordResetRepository";
import {
  createPasswordUser,
  findPasswordUser,
  upsertGoogleUser,
} from "../repositories/userRepository";

// Admins are decided by the ADMIN_EMAILS setting, not by anything the user sends.
const roleFor = (email: string): string =>
  env.ADMIN_EMAILS.includes(email.toLowerCase())
    ? UserRole.Admin
    : UserRole.Guest;

export async function signInWithGoogle(code: string): Promise<SessionUser> {
  const profile = await fetchGoogleProfile(code);
  return upsertGoogleUser({ ...profile, role: roleFor(profile.email) });
}

export const sessionTokenFor = (user: SessionUser): string =>
  encodeSession(newSession(user, Date.now()));

export interface PasswordRegistration {
  name: string;
  email: string;
  password: string;
}

export async function registerWithPassword(
  input: PasswordRegistration,
): Promise<SessionUser> {
  const user = await createPasswordUser({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: roleFor(input.email),
  });
  if (!user)
    throw new AppError(HttpStatus.Conflict, ErrorMessage.EmailAlreadyRegistered);
  return user;
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<SessionUser> {
  const account = await findPasswordUser(email);
  const valid = account?.passwordHash
    ? await passwordMatches(password, account.passwordHash)
    : false;
  if (!account || !valid)
    throw new AppError(HttpStatus.Unauthorized, ErrorMessage.InvalidCredentials);
  const { id, name, email: address, role } = account;
  return { id, name, email: address, role };
}

const hashResetToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function requestPasswordReset(email: string): Promise<string | null> {
  const account = await findPasswordUser(email);
  if (!account) return null;
  const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("hex");
  await resetRepo.createToken(
    account.id,
    hashResetToken(token),
    new Date(Date.now() + PASSWORD_RESET_LIFETIME_MS),
  );
  return token;
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const reset = await resetRepo.findValidToken(hashResetToken(token));
  if (!reset) throw new AppError(HttpStatus.Unauthorized, ErrorMessage.InvalidResetToken);
  await rows("UPDATE users SET password_hash = $1 WHERE id = $2", [
    await hashPassword(password),
    reset.userId,
  ]);
  await resetRepo.consumeToken(reset.id);
}