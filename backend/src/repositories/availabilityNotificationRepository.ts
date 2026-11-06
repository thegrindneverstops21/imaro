import { rows } from "../db/pool";

export async function subscribe(branchSlug: string, email: string): Promise<boolean> {
  const result = await rows<{ id: number }>(
    `INSERT INTO availability_notifications (branch_id, email)
     SELECT id, $2 FROM branches
     WHERE slug = $1 AND is_published
     ON CONFLICT (branch_id, email) DO NOTHING
     RETURNING id`,
    [branchSlug, email],
  );
  return result.length > 0;
}
