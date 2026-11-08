/** Simple className merger for Tailwind-like projects.
 *  Joins multiple className strings, removing duplicates and falsy values.
 */
export function cn(...classes: (string | undefined | null)[]) {
  return classes.filter((c) => c && typeof c === "string").join(" ");
}