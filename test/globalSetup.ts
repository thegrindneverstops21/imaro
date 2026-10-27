import { SqlFile } from "../src/constants/domain";
import { applySqlFiles } from "../src/db/applySqlFiles";
import { pool } from "../src/db/pool";

// Rebuilds the test database from schema + seed once before the whole run.
export async function setup(): Promise<void> {
  await applySqlFiles([SqlFile.Schema, SqlFile.Seed]);
  await pool.end();
}
