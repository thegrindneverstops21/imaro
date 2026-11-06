import { SqlFile } from "../.vscode/src/constants/domain";
import { applySqlFiles } from "../.vscode/src/db/applySqlFiles";
import { pool } from "../.vscode/src/db/pool";

// Rebuilds the test database from schema + seed once before the whole run.
export async function setup(): Promise<void> {
  await applySqlFiles([SqlFile.Schema, SqlFile.Seed]);
  await pool.end();
}
