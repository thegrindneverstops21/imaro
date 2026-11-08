import { fallbackError, friendlyError } from "./errors";
import type { PageMeta } from "../types/api";

export const API_URL =
  (
    import.meta as ImportMeta & {
      env?: { VITE_API_URL?: string };
    }
  ).env?.VITE_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function send<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; meta: PageMeta | null }> {
  let session: string | null = null;
  try { session = localStorage.getItem("imaro.session"); } catch { /* Guest access remains available without storage. */ }
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  if (session) headers.set("authorization", `Bearer ${session}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (cause) {
    if (options.signal?.aborted) throw cause;
    throw new ApiError("Unable to connect. Please check your internet connection and try again.", 0);
  }
  const body = await response.json().catch(() => null) as {
    data?: T;
    meta?: PageMeta;
    error?: { message?: string };
  } | null;
  if (!response.ok) throw new ApiError(friendlyError(body?.error?.message, response.status), response.status);
  if (!body || body.data === undefined) throw new ApiError(fallbackError, response.status);
  return { data: body.data, meta: body.meta ?? null };
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  return (await send<T>(path, options)).data;
}

// For paginated endpoints whose meta (total, ratingAverage) the page needs.
export async function requestPage<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; meta: PageMeta | null }> {
  return send<T>(path, options);
}

// Small helper so handlers read `request(path, json("POST", body))`.
export const json = (method: string, value?: unknown): RequestInit => ({
  method,
  ...(value === undefined ? {} : { body: JSON.stringify(value) }),
});
export const bookingHeaders = (token: string): HeadersInit => ({
  "x-booking-token": token,
});

export function message(error: unknown) {
  return error instanceof ApiError ? error.message : friendlyError(error instanceof Error ? error.message : null);
}
