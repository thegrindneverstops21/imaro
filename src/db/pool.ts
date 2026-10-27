import { Pool, type QueryResultRow } from "pg";
import { env } from "../config/env";

export const pool = new Pool({ connectionString: env.DATABASE_URL });

export async function rows<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}
