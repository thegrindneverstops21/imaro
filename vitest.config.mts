import { defineConfig } from "vitest/config";

const DEFAULT_TEST_DATABASE_URL =
  "postgres://postgres:postgres@localhost:5432/stillmere_test";

// Tests always run against their own database so db:setup on the dev database is never touched.
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
process.env.DATABASE_URL = testDatabaseUrl;

export default defineConfig({
  test: {
    env: { DATABASE_URL: testDatabaseUrl, NODE_ENV: "test" },
    globalSetup: ["./test/globalSetup.ts"],
    fileParallelism: false,
  },
});
