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
      success: `${input.name} created.`,
      confirm: `Create ${input.name} ${input.isPublished ? "as a published property visible to guests" : "as a draft hidden from guests"}? Rooms and prices are configured next.`,
      confirmLabel: "Create branch",
      refresh: () => reload(input.slug.trim()),
    });

  const publish = (branch: Branch) =>
    writes.write({
      path: `/admin/branches/${branch.id}`,
      options: json("PATCH", { isPublished: true }),
      success: `${branch.name} published.`,
      refresh: reload,
      confirm: `Publish ${branch.name}? It will become visible to guests.`,
      confirmLabel: "Publish",
    });

  const unpublish = (branch: Branch) =>
    writes.write({
      path: `/admin/branches/${branch.id}`,
      options: json("DELETE"),
      success: `${branch.name} unpublished.`,
      refresh: reload,
      confirm: UNPUBLISH_WARNING,
      confirmLabel: "Unpublish",
      danger: true,
    });

  async function saveEdit() {
    if (!edit) return;
    const saved = await writes.write({
      path: `/admin/branches/${edit.id}`,
      options: json("PATCH", { name: edit.name, description: edit.description }),
      success: `${edit.name} updated.`,
      confirm: `Save the updated name and description for ${edit.name}? Published property details are visible to guests.`,
      confirmLabel: "Save branch",
      refresh: reload,
    });
    if (saved) setEdit(null);
  }

  return { edit, setEdit, create, publish, unpublish, saveEdit };
}