import { readFileSync } from "fs";
import { join } from "path";
import { pool } from "./pool";

export async function applySqlFiles(files: string[]): Promise<void> {
  for (const file of files) {
    await pool.query(readFileSync(join(__dirname, file), "utf8"));
    console.log(`✔ ${file}`);
  }
}
