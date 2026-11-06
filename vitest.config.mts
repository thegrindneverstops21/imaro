/**
 * TEST RUNNER CONFIGURATION (npm test)
 *
 * Tests run against a SEPARATE database (TEST_DATABASE_URL) because the setup
 * step drops and recreates every table. The guard below refuses to start if the
 * test database is the same as your development database — that protection is
 * the most important line in this file.
 */
import "dotenv/config";
import { defineConfig } from "vitest/config";

const DEFAULT_TEST_DATABASE_URL = "postgres://postgres:postgres@localhost:5432/imaro_test";

const devDatabaseUrl = process.env.DATABASE_URL;
const testDatabaseUrl = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;

// The test run drops and recreates every table, so it must never point at the dev database.
if (testDatabaseUrl === devDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL must be a different database from DATABASE_URL.");
}
process.env.DATABASE_URL = testDatabaseUrl;

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: testDatabaseUrl,
      NODE_ENV: "test",
      // Fixed test-only values so the suite never depends on your real .env secrets.
      SESSION_SECRET: "test-only-session-secret-with-at-least-32-characters",
      GOOGLE_CLIENT_ID: "test-google-client-id",
      GOOGLE_CLIENT_SECRET: "test-google-client-secret",
      ADMIN_EMAILS: "admin@test.example",
    },
    // Runs once before everything: rebuilds the schema + seed data.
    globalSetup: ["./test/globalSetup.ts"],
    // Test files share one database, so they must not run at the same time.
    fileParallelism: false,
  },
});