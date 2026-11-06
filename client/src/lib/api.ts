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

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const session = localStorage.getItem("imaro.session");
  const headers = new Headers(options.headers);
  if (options.body) headers.set("content-type", "application/json");
  if (session) headers.set("authorization", `Bearer ${session}`);

  // fetch does not throw on 404/500 — we must check `response.ok` ourselves.
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body = (await response.json()) as {
    data?: T;
    error?: { message?: string };
  };
  if (!response.ok || body.data === undefined) {
    throw new ApiError(
      body.error?.message ??
        "We could not complete that request. Please try again.",
      response.status,
    );
  }
  return body.data;
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
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
