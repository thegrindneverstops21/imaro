import { useCallback, useEffect, useRef, useState } from "react";
import { message, request } from "../../lib/api";
import type { Branch } from "../../types/api";

type Loaded = { branches: Branch[]; branch: Branch | null };

async function loadInformation(
  slug: string,
  signal: AbortSignal,
  cached: Branch[],
): Promise<Loaded> {
  const branches = cached.length
    ? cached
    : await request<Branch[]>("/branches", { signal });
  const chosen = branches.find((item) => item.slug === slug) ?? branches[0];
  if (!chosen) return { branches, branch: null };
  const path = `/branches/${encodeURIComponent(chosen.slug)}`;
  return { branches, branch: await request<Branch>(path, { signal }) };
}

export function useBranchInformation(slug: string) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [attempt, setAttempt] = useState(0);
  const known = useRef<Branch[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setStatus({ loading: true, error: "" });
    setBranch(null); // never show one location's contact details under another
    loadInformation(slug, controller.signal, known.current)
      .then((result) => {
        if (controller.signal.aborted) return;
        known.current = result.branches;
        setBranches(result.branches);
        setBranch(result.branch);
        setStatus({ loading: false, error: "" });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setStatus({ loading: false, error: message(cause) });
      });
    return () => controller.abort();
  }, [slug, attempt]);

  const reload = useCallback(() => {
    known.current = [];
    setAttempt((value) => value + 1);
  }, []);

  return { branches, branch, ...status, reload };
}
