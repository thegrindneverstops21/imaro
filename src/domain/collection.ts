export function groupBy<T>(
  items: T[],
  keyOf: (item: T) => number,
): Map<number, T[]> {
  const groups = new Map<number, T[]>();
  // `groups.get(key) ?? []` means "the existing list, or an empty one".
  for (const item of items) {
    const key = keyOf(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}
