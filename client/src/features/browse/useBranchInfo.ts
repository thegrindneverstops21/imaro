import { useCallback, useEffect, useRef, useState } from "react";
import { message, request } from "../../lib/api";
import type { Branch } from "../../types/api";

type Loaded = { branches: Branch[]; branch: Branch | null; missing: boolean };

async function loadInformation(
  slug: string,
  signal: AbortSignal,
  cached: Branch[],
): Promise<Loaded> {
  const branches = cached.length
    ? cached
    : await request<Branch[]>("/branches", { signal });
  // A deep-linked location is never silently replaced by a different property.
  if (slug && !branches.some((item) => item.slug === slug))
    return { branches, branch: null, missing: true };
  const chosen = slug
    ? branches.find((item) => item.slug === slug)
    : branches[0];
  if (!chosen) return { branches, branch: null, missing: false };
  const path = `/branches/${encodeURIComponent(chosen.slug)}`;
  return {
    branches,
    branch: await request<Branch>(path, { signal }),
    missing: false,
  };
}

export function useBranchInformation(slug: string) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [missing, setMissing] = useState(false);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [attempt, setAttempt] = useState(0);
  const known = useRef<Branch[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setStatus({ loading: true, error: "" });
    setBranch(null); // never show one location's contact details under another
    setMissing(false);
    loadInformation(slug, controller.signal, known.current)
      .then((result) => {
        if (controller.signal.aborted) return;
        known.current = result.branches;
        setBranches(result.branches);
        setBranch(result.branch);
        setMissing(result.missing);
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

  return { branches, branch, missing, ...status, reload };
}
