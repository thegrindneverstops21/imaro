const INTENT_KEY = "imaro.auth-intent";
const PENDING_SAVE_KEY = "imaro.pending-save";

// Only same-site paths are accepted so sign-in can never be used as an open redirect.
const AUTH_PATH = /^\/(login|auth\/callback)(\/|[?#]|$)/;

export function safePath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "";
  if (AUTH_PATH.test(value)) return "";
  return value;
}

// The sign-in link for a page, so signing in returns the guest to that page.
export function signInLink(path: string): string {
  return `/login?next=${encodeURIComponent(safePath(path) || "/")}`;
}

function read(key: string): string {
  try {
    return sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function write(key: string, value: string): void {
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    // Signing in still works when browser storage is blocked; the page is just not remembered.
  }
}

export function rememberSignInNext(path: string): void {
  write(INTENT_KEY, safePath(path));
}

export function takeSignInNext(): string {
  const value = safePath(read(INTENT_KEY));
  write(INTENT_KEY, "");
  return value;
}

export function rememberPendingSave(slug: string): void {
  write(PENDING_SAVE_KEY, slug);
}

export function takePendingSave(): string {
  const value = read(PENDING_SAVE_KEY);
  write(PENDING_SAVE_KEY, "");
  return value;
}
