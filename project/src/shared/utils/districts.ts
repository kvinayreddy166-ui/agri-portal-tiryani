export function normalizeDistrictName(value: unknown) {
  return String(value ?? '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Groups district names that differ only by spacing/punctuation/casing
// (e.g. "Kumuram Bheem" vs "Kumurambheem") into a single entry.
export function groupDistrictCounts(
  values: Array<string | null | undefined>,
  fallback = 'Not specified'
): { name: string; count: number }[] {
  const groups = new Map<string, { variants: Map<string, number>; total: number }>();

  for (const value of values) {
    const name = normalizeDistrictName(value) || fallback;
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let group = groups.get(key);
    if (!group) {
      group = { variants: new Map(), total: 0 };
      groups.set(key, group);
    }
    group.total += 1;
    group.variants.set(name, (group.variants.get(name) ?? 0) + 1);
  }

  return [...groups.values()]
    .map((group) => {
      let name = fallback;
      let best = -1;
      for (const [variant, variantCount] of group.variants) {
        if (variantCount > best) {
          best = variantCount;
          name = variant;
        }
      }
      return { name, count: group.total };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
