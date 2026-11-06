import { z } from "zod";
import { ACCOUNT_LIMITS } from "../constants/account";
import { GUEST_FIELD_LIMITS, PASSWORD_LIMITS } from "../constants/domain";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(GUEST_FIELD_LIMITS.emailMax);

export const registerBody = z.object({
  name: z.string().trim().min(ACCOUNT_LIMITS.nameMin).max(GUEST_FIELD_LIMITS.nameMax),
  email,
  password: z.string().min(PASSWORD_LIMITS.min).max(PASSWORD_LIMITS.max),
});

export const signInBody = z.object({
  email,
  password: z.string().min(1).max(PASSWORD_LIMITS.max),
});
