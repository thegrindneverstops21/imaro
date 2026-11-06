import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const deriveKey = promisify(scrypt) as (
  password: string,
  salt: string,
  length: number,
) => Promise<Buffer>;

const ALGORITHM = "scrypt";
const SALT_BYTES = 16;
const KEY_LENGTH = 64;

// Every password gets its own random salt, so two people with the same password still have different hashes.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const key = await deriveKey(password, salt, KEY_LENGTH);
  return `${ALGORITHM}:${salt}:${key.toString("hex")}`;
}

// Re-derives the key with the stored salt and compares in constant time, so the check does not leak how much matched.
export async function passwordMatches(
  password: string,
  stored: string,
): Promise<boolean> {
  const [algorithm, salt, hash] = stored.split(":");
  if (algorithm !== ALGORITHM || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = await deriveKey(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
