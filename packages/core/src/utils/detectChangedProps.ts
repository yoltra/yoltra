/**
 * @module @yoltra/core
 */

/**
 * Computes the list of **dotted leaf paths** that changed between two values.
 *
 * The algorithm performs a deep structural comparison with special handling for:
 * - **Primitives / null** → treated as leafs (change = current `path`; two `NaN`s are equal)
 * - **Date** → compares `getTime()`
 * - **RegExp** → compares `source` and `flags`
 * - **Arrays** → if lengths differ, the whole array path is marked changed; otherwise compares
 *   element-by-element producing paths like `"items.0.title"`
 * - **Objects** → compares by the **union of keys**, recursing into shared keys and marking
 *   added/removed keys as changed at their **full path**
 *
 * Cycles are handled by tracking the `(old, new)` pairs currently on the **recursion path**
 * (added on entry, removed on unwind). A pair is skipped only when it is a genuine ancestor of
 * itself (a real cycle) — a pair that merely appears again at a *sibling* path (legitimate
 * aliasing, e.g. the same object referenced from two keys) is still diffed, so real changes at
 * the second site are never dropped.
 *
 * @param oldState - Previous value to diff.
 * @param newState - Next value to diff.
 * @param path - Current dotted path (callers pass `""` for root; recursion appends segments).
 * @param ancestors - (Advanced) Pairs on the current recursion path, for cycle detection. You
 * generally never pass this.
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
  ancestors: Map<object, Set<object>> = new Map(),
): string[] {
  if (oldState === newState) return [];

  if (
    typeof oldState !== "object" ||
    typeof newState !== "object" ||
    oldState === null ||
    newState === null
  ) {
    // Two NaNs are never `===` but represent no change — don't report a spurious diff.
    if (typeof oldState === "number" && Number.isNaN(oldState) && Number.isNaN(newState as number)) {
      return [];
    }
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

  // Cycle guard: skip a pair only when it is currently an ANCESTOR on this
  // recursion path (a genuine cycle). A pair seen earlier at a sibling path is
  // legitimate aliasing and must still be diffed.
  const active = ancestors.get(oldObj);
  if (active?.has(newObj)) return [];
  const onPath = active ?? new Set<object>();
  onPath.add(newObj);
  if (!active) ancestors.set(oldObj, onPath);

  try {
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
        changedPaths.push(...detectChangedProps(a[i], b[i], childPath, ancestors));
      }
      return changedPaths.filter(Boolean);
    }

    const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);

    for (const key of allKeys) {
      const nextPath = path ? `${path}.${key}` : key;
      const hasOld = Object.prototype.hasOwnProperty.call(oldState, key);
      const hasNew = Object.prototype.hasOwnProperty.call(newState, key);

      if (!hasOld || !hasNew) {
        changedPaths.push(nextPath);
        continue;
      }

      changedPaths.push(...detectChangedProps(oldState[key], newState[key], nextPath, ancestors));
    }

    return changedPaths.filter(Boolean);
  } finally {
    // Unwind: leave the current recursion path so sibling branches can revisit
    // this pair (legitimate aliasing) without being suppressed as a cycle.
    onPath.delete(newObj);
    if (onPath.size === 0) ancestors.delete(oldObj);
  }
}
