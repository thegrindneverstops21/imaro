import { rows } from "../db/pool";

export async function createToken(
  userId: number,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await rows(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt],
  );
}

export async function findValidToken(tokenHash: string) {
  const [token] = await rows<{ id: number; userId: number }>(
    `SELECT id, user_id AS "userId"
     FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
    [tokenHash],
  );
  return token ?? null;
}

export const consumeToken = (id: number) =>
  rows(`UPDATE password_reset_tokens SET used_at = now() WHERE id = $1`, [id]);
