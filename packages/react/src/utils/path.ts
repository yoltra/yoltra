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
