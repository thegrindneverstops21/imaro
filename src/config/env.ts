import "dotenv/config";
import { z } from "zod";
import {
  DEFAULT_CLIENT_URL,
  DEFAULT_PORT,
  Environment,
  ExitCode,
} from "../constants/domain";

const schema = z.object({
  NODE_ENV: z
    .enum([Environment.Development, Environment.Test, Environment.Production])
    .default(Environment.Development),
  PORT: z.coerce.number().default(DEFAULT_PORT),
  DATABASE_URL: z.string().min(1),
  CLIENT_URL: z.string().default(DEFAULT_CLIENT_URL),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.issues);
  process.exit(ExitCode.Failure);
}

export const env = parsed.data;
