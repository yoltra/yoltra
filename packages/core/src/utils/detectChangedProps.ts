/**
 * @module @yoltra/core
 */

/**
 * Computes the list of **dotted leaf paths** that changed between two values.
 *
 * The algorithm performs a deep structural comparison with special handling for:
 * - **Primitives / null** → treated as leafs (change = current `path`)
 * - **Date** → compares `getTime()`
 * - **RegExp** → compares `source` and `flags`
 * - **Arrays** → if lengths differ, the whole array path is marked changed; otherwise compares
 *   element-by-element producing paths like `"items.0.title"`
 * - **Objects** → compares by the **union of keys**, recursing into shared keys and marking
 *   added/removed keys as changed at their **full path**
 *
 * Cycles and repeated object aliases are handled via **pair-wise** tracking using a
 * `WeakMap<object, WeakSet<object>>` so recursion doesn't loop and shared subgraphs do not
 * produce false negatives.
 *
 * @param oldState - Previous value to diff.
 * @param newState - Next value to diff.
 * @param path - Current dotted path (callers pass `""` for root; recursion appends segments).
 * @param seenPairs - (Advanced) Pair tracker for cycle/alias detection. You generally never pass this.
 * @returns An array of **dotted leaf paths** that changed. Paths use `"."` as a separator and
 * indices for arrays (e.g., `"todos.0.title"`). If nothing changed, returns `[]`.
 *
 * @example Basic object leaf
 * ```ts
 * detectChangedProps(
 *   { user: { name: 'Ada', age: 37 } },
 *   { user: { name: 'Grace', age: 37 } }
 * );
 * // => ['user.name']
 * ```
 *
 * @example Array element change
 * ```ts
 * detectChangedProps(
 *   { items: [{ title: 'A' }, { title: 'B' }] },
 *   { items: [{ title: 'A+' }, { title: 'B' }] }
 * );
 * // => ['items.0.title']
 * ```
 *
 * @example Array length change (marks the array path)
 * ```ts
 * detectChangedProps({ nums: [1,2] }, { nums: [1,2,3] });
 * // => ['nums']
 * ```
 *
 * @example Dates & RegExps
 * ```ts
 * detectChangedProps(new Date(0), new Date(0), 'createdAt');      // => []
 * detectChangedProps(new Date(0), new Date(1), 'createdAt');      // => ['createdAt']
 * detectChangedProps(/a/i, /a/i, 'pattern');                      // => []
 * detectChangedProps(/a/i, /a/g, 'pattern');                      // => ['pattern']
 * ```
 *
 * @remarks
 * - If `oldState === newState` (same reference), returns `[]` immediately.
 * - For objects, only **own enumerable** keys are compared (via `Object.keys`).
 * - Returned paths are **leaf paths** where a primitive/terminal difference was detected; for arrays,
 *   a length change is treated as a leaf change at the array path.
 *
 * @public
 */
export function detectChangedProps(
  oldState: any,
  newState: any,
  path = "",
  seenPairs: WeakMap<object, WeakSet<object>> = new WeakMap(),
): string[] {
  if (oldState === newState) return [];

  if (
    typeof oldState !== "object" ||
    typeof newState !== "object" ||
    oldState === null ||
    newState === null
  ) {
    return [path];
  }

  if (oldState instanceof Date && newState instanceof Date) {
    return oldState.getTime() === newState.getTime() ? [] : [path];
  }

  if (oldState instanceof RegExp && newState instanceof RegExp) {
    return oldState.source === newState.source && newState.flags === oldState.flags ? [] : [path];
  }

  const oldObj = oldState as object;
  const newObj = newState as object;
  let bucket = seenPairs.get(oldObj);
  if (bucket) {
    if (bucket.has(newObj)) return [];
    bucket.add(newObj);
  } else {
    bucket = new WeakSet<object>();
    bucket.add(newObj);
    seenPairs.set(oldObj, bucket);
  }

  const isArrOld = Array.isArray(oldState);
  const isArrNew = Array.isArray(newState);
  if (isArrOld !== isArrNew) return [path];

  const changedPaths: string[] = [];

  if (isArrOld) {
    const a = oldState;
    const b = newState as any[];
    if (a.length !== b.length) return [path];

    for (let i = 0; i < a.length; i++) {
      const childPath = path ? `${path}.${i}` : `${i}`;
      const elementPaths = detectChangedProps(a[i], b[i], childPath, seenPairs);
      changedPaths.push(...elementPaths);
    }
    return changedPaths.filter(Boolean);
  }

  const oldKeys = Object.keys(oldState);
  const newKeys = Object.keys(newState);
  const allKeys = new Set([...oldKeys, ...newKeys]);

  for (const key of allKeys) {
    const nextPath = path ? `${path}.${key}` : key;
    const hasOld = Object.prototype.hasOwnProperty.call(oldState, key);
    const hasNew = Object.prototype.hasOwnProperty.call(newState, key);

    if (!hasOld) {
      changedPaths.push(nextPath);
      continue;
    }
    if (!hasNew) {
      changedPaths.push(nextPath);
      continue;
    }

    const nested = detectChangedProps(oldState[key], newState[key], nextPath, seenPairs);
    changedPaths.push(...nested);
  }

  return changedPaths.filter(Boolean);
}