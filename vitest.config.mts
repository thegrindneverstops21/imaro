import "dotenv/config";
import { defineConfig } from "vitest/config";

const DEFAULT_TEST_DATABASE_URL = "postgres://postgres:postgres@localhost:5432/stillmere_test";

const devDatabaseUrl = process.env.DATABASE_URL;
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;

// The test run drops and recreates every table, so it must never point at the dev database.
if (testDatabaseUrl === devDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL must be a different database from DATABASE_URL.");
}
process.env.DATABASE_URL = testDatabaseUrl;

export default defineConfig({
  test: {
    env: { DATABASE_URL: testDatabaseUrl, NODE_ENV: "test" },
    globalSetup: ["./test/globalSetup.ts"],
    fileParallelism: false,
  },
});
