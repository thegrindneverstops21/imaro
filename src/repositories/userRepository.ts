import { UserRole } from "../constants/domain";
import { rows } from "../db/pool";
import type {
  GoogleUserInput,
  PasswordAccount,
  PasswordUserInput,
  SessionUser,
} from "../domain/authTypes";

// Signing in again updates the record. Admin rights can only be granted here, never removed.
const UPSERT_GOOGLE_USER = `
  INSERT INTO users (name, email, google_id, role)
  VALUES ($1, lower($2), $3, $4)
  ON CONFLICT (lower(email)) DO UPDATE
    SET name = EXCLUDED.name,
        google_id = EXCLUDED.google_id,
        role = CASE WHEN EXCLUDED.role = '${UserRole.Admin}' THEN '${UserRole.Admin}' ELSE users.role END
  RETURNING id, name, email, role`;

const USER_BY_ID = `SELECT id, name, email, role FROM users WHERE id = $1`;

// A local sign-up never takes over an existing email: the conflict is ignored so the route can report it.
const INSERT_PASSWORD_USER = `
  INSERT INTO users (name, email, password_hash, role)
  VALUES ($1, lower($2), $3, $4)
  ON CONFLICT (lower(email)) DO NOTHING
  RETURNING id, name, email, role`;

const PASSWORD_USER_BY_EMAIL = `
  SELECT id, name, email, role, password_hash AS "passwordHash"
  FROM users
  WHERE lower(email) = lower($1)`;

export async function upsertGoogleUser(
  input: GoogleUserInput,
): Promise<SessionUser> {
  const params = [input.name, input.email, input.googleId, input.role];
  const [user] = await rows<SessionUser>(UPSERT_GOOGLE_USER, params);
  return user!;
}

export async function findUserById(id: number): Promise<SessionUser | null> {
  const [user] = await rows<SessionUser>(USER_BY_ID, [id]);
  return user ?? null;
}

export async function createPasswordUser(
  input: PasswordUserInput,
): Promise<SessionUser | null> {
  const [user] = await rows<SessionUser>(INSERT_PASSWORD_USER, [
    input.name,
    input.email,
    input.passwordHash,
    input.role,
  ]);
  return user ?? null;
}

export async function findPasswordUser(
  email: string,
): Promise<PasswordAccount | null> {
  const [user] = await rows<PasswordAccount>(PASSWORD_USER_BY_EMAIL, [email]);
  return user ?? null;
}
