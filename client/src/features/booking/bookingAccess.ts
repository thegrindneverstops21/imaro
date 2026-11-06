const memory = new Map<string, string>();

export const bookingAccessKey = (reference: string) =>
  `imaro.booking.${reference}`;

function storedToken(reference: string): string {
  try {
    return localStorage.getItem(bookingAccessKey(reference)) ?? "";
  } catch {
    // Private browsing and blocked storage must not break a successful hold.
    return "";
  }
}

// The token is kept for this tab as well as localStorage: a hold that the server
// accepted must stay usable even when the browser refuses to persist it.
export function rememberBookingToken(
  reference: string,
  token: string,
): boolean {
  if (!token) return false;
  memory.set(reference, token);
  try {
    localStorage.setItem(bookingAccessKey(reference), token);
    return true;
  } catch {
    return false;
  }
}

export function bookingToken(reference: string): string {
  return memory.get(reference) || storedToken(reference);
}

export function bookingTokenPersisted(reference: string): boolean {
  return Boolean(storedToken(reference));
}
