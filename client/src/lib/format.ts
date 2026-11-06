// identifiers, stored records, and request payloads retain their existing API values.
export const displayBrand = (value: string) =>
  value.replace(/\bStillmere\b/gi, "Imaro");

// 1250 -> "R 1 250" (South African rand, no cents shown).
export const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);

// "2026-05-01" -> "1 May 2026". timeZone UTC stops the day shifting by one in timezones behind UTC.
export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
  
// A negative balance is an overpayment, not an automatic refund.
export const balanceLine = (balanceDue: number) =>
  balanceDue < 0
    ? { name: "Overpaid", value: formatMoney(-balanceDue) }
    : { name: "Balance due", value: formatMoney(balanceDue) };
