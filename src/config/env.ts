import "dotenv/config";
import { z } from "zod";
import {
  DEFAULT_CLIENT_URL,
  DEFAULT_PORT,
  Environment,
  ExitCode,
  MIN_SESSION_SECRET_LENGTH,
} from "../constants/domain";

const DEFAULT_GOOGLE_REDIRECT_URI =
  "http://localhost:4000/api/v1/auth/google/callback";

const emailList = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

const schema = z.object({
  PAYFAST_MERCHANT_ID: z.string().optional(),
  PAYFAST_MERCHANT_KEY: z.string().optional(),
  PAYFAST_PASSPHRASE: z.string().default(""),
  PAYFAST_SANDBOX: z.enum(["true", "false"]).default("true").transform((value) => value === "true"),
  PAYFAST_NOTIFY_URL: z.string().url().optional(),
  PAYFAST_RETURN_URL: z.string().url().optional(),
  PAYFAST_CANCEL_URL: z.string().url().optional(),
  NODE_ENV: z
    .enum([Environment.Development, Environment.Test, Environment.Production])
    .default(Environment.Development),
  PORT: z.coerce.number().default(DEFAULT_PORT),
  DATABASE_URL: z.string().min(1),
  CLIENT_URL: z.string().default(DEFAULT_CLIENT_URL),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().default(DEFAULT_GOOGLE_REDIRECT_URI),
  // Required in every environment: there is deliberately no built-in fallback secret.
  SESSION_SECRET: z.string().min(MIN_SESSION_SECRET_LENGTH),
  ADMIN_EMAILS: emailList,
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.issues);
  process.exit(ExitCode.Failure);
}

export const env = parsed.data;
