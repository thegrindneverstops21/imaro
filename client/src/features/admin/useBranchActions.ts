import { useState } from "react";
import { json } from "../../lib/api";
import type { Branch } from "../../types/api";
import { toBranchPayload, type BranchInput } from "./branchForm";
import type { Writes } from "./useAdminWrites";

export type BranchEdit = { id: number; name: string; description: string };

const UNPUBLISH_WARNING = "Unpublish this branch? Guests will no longer see it in search.";

export function useBranchActions(
  reload: (preferredSlug?: string) => Promise<void>,
  writes: Writes,
) {
  const [edit, setEdit] = useState<BranchEdit | null>(null);

  const create = (input: BranchInput) =>
    writes.write({
      path: "/admin/branches",
      options: json("POST", toBranchPayload(input)),
      success: "Branch created.",
      refresh: () => reload(input.slug),
    });

  const publish = (branch: Branch) =>
    writes.write({
      path: `/admin/branches/${branch.id}`,
      options: json("PATCH", { isPublished: true }),
      success: `${branch.name} published.`,
      refresh: reload,
    });

  const unpublish = (branch: Branch) =>
    writes.write({
      path: `/admin/branches/${branch.id}`,
      options: json("DELETE"),
      success: `${branch.name} unpublished.`,
      refresh: reload,
      confirm: UNPUBLISH_WARNING,
    });

  async function saveEdit() {
    if (!edit) return;
    const saved = await writes.write({
      path: `/admin/branches/${edit.id}`,
      options: json("PATCH", { name: edit.name, description: edit.description }),
      success: "Changes saved.",
      refresh: reload,
    });
    if (saved) setEdit(null);
  }

  return { edit, setEdit, create, publish, unpublish, saveEdit };
}