/**
 * Reading and expanding dotted state paths.
 *
 * @remarks
 * Moved out of `Store.ts` unchanged. Neither function touched an instance field.
 *
 * `Store` still exposes both as members, and deliberately so. `Store.buildAncestorPaths` is
 * public API that appears in the committed reference, and `getAtPath` is replaced on the
 * instance by a test that counts the walks a change description costs, so the internal callers
 * have to keep reaching it through `this`.
 *
 * @module
 */

/**
 * Reads a dotted path from an object (supports numeric array indices via string keys).
 *
 * @param obj - Root object (slice or value).
 * @param path - Dotted path; leading dot is ignored.
 * @returns The value at the path, or `undefined`.
 *
 * @internal
 */
export function getAtPath(obj: any, path: string): any {
  if (!path) return obj;

  // Normalize any accidental leading dots
  const clean = path[0] === "." ? path.slice(1) : path;
  const parts = clean.split(".");

  let cur = obj;
  for (const seg of parts) {
    if (cur == null) return undefined;
    cur = cur[seg as any];
  }
  return cur;
}

/**
 * Builds ancestor paths for a dotted path.
 *
 * For `"a.b.c"`, returns `["a", "a.b", "a.b.c"]`. Leading dots are trimmed.
 *
 * @param path - Dotted path string.
 * @returns Array of ancestor paths.
 *
 * @example
 * ```ts
 * buildAncestorPaths('x.y.z'); // ['x','x.y','x.y.z']
 * ```
 *
 * @public
 */
export function buildAncestorPaths(path: string): string[] {
  if (!path) return [];

  const clean = path[0] === "." ? path.slice(1) : path;
  const parts = clean.split(".");
  const out: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    out.push(parts.slice(0, i + 1).join("."));
  }

  return out;
}
