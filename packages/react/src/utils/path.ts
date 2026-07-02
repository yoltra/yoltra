/** @internal */
export function hasWildcard(p: string): boolean {
  return p.includes("*");
}

/** @internal */
export function normalizePath(p: string): string {
  return p.replace(/^\./, "");
}

/** @internal */
export function splitPath(p: string): string[] {
  return normalizePath(p).split(".").filter(Boolean);
}

/**
 * Stable signature for a specs array, for use as a `useMemo` dependency instead
 * of `JSON.stringify` — deterministic and avoids serializing arbitrary values.
 * Reducer names and dotted paths never contain the `:`/`,`/`|` delimiters, so
 * the signature is collision-free for realistic inputs.
 * @internal
 */
export function specsSignature(
  specs: ReadonlyArray<{ reducer: string; property: string | readonly string[] }>,
): string {
  return specs
    .map((s) => {
      const prop = Array.isArray(s.property)
        ? (s.property as readonly string[]).join(",")
        : (s.property as string);
      return `${s.reducer}:${prop}`;
    })
    .join("|");
}

/**
 * Reads a dotted path from an object; returns `undefined` when a segment is missing.
 * @internal
 */
export function getAtPath(obj: any, path: string): any {
  if (!path) return obj;

  let cur = obj;
  for (const seg of splitPath(path)) {
    if (cur == null) return undefined;
    cur = cur[seg];
  }

  return cur;
}
