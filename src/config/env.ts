import "dotenv/config";
import { z } from "zod";
import {
  DEFAULT_CLIENT_URL,
  DEFAULT_PORT,
  Environment,
  ExitCode,
} from "../constants/domain";

const MIN_SESSION_SECRET_LENGTH = 32;

const schema = z.object({
  NODE_ENV: z
    .enum([Environment.Development, Environment.Test, Environment.Production])
    .default(Environment.Development),
  PORT: z.coerce.number().default(DEFAULT_PORT),
  DATABASE_URL: z.string().min(1),
  CLIENT_URL: z.string().default(DEFAULT_CLIENT_URL),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().default("http://localhost:4000/api/v1/auth/google/callback"),
  SESSION_SECRET: z.string().min(MIN_SESSION_SECRET_LENGTH).optional(),
  ADMIN_EMAILS: z.string().default(""),
}).superRefine((values, ctx) => {
  if (values.NODE_ENV === Environment.Production && !values.SESSION_SECRET) {
    ctx.addIssue({ code: "custom", path: ["SESSION_SECRET"], message: "Required in production" });
  }
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.issues);
  process.exit(ExitCode.Failure);
}

export const env = parsed.data;
