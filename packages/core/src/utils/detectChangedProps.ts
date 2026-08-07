/**
 * @module @yoltra/core
 */

/**
 * Keys already warned about, so a hot path does not turn into a log.
 *
 * @internal
 */
const warnedDottedKeys = new Set<string>();

/** @internal */
function warnDottedKey(path: string, key: string): void {
  const full = path ? `${path}.${key}` : key;
  if (warnedDottedKeys.has(full)) return;
  warnedDottedKeys.add(full);
  console.warn(
    `[yoltra] State key "${key}"${path ? ` under "${path}"` : ""} contains a dot. Paths are ` +
      `dotted, so this key is indistinguishable from nested objects of the same name: a ` +
      `subscription to "${full}" may match the wrong value, and DevTools patches for it will ` +
      `address the wrong node. Rename the key, or nest it.`,
  );
}


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
  const out: string[] = [];
  walk(oldState, newState, path, ancestors, out);
  return out;
}

/**
 * The recursion, writing into one array rather than returning a new one per node.
 *
 * @remarks
 * Every node used to allocate its own `string[]` and every parent spread its children's back in.
 * On a thousand-entity normalised map that is roughly four thousand short-lived arrays per diff,
 * for a result that is usually a single path — the allocation dwarfed the comparison it existed
 * to report.
 *
 * @internal
 */
function walk(
  oldState: any,
  newState: any,
  path: string,
  ancestors: Map<object, Set<object>>,
  out: string[],
): void {
  if (oldState === newState) return;

  if (
    typeof oldState !== "object" ||
    typeof newState !== "object" ||
    oldState === null ||
    newState === null
  ) {
    // Two NaNs are never `===` but represent no change — don't report a spurious diff.
    if (typeof oldState === "number" && Number.isNaN(oldState) && Number.isNaN(newState as number)) {
      return;
    }
    out.push(path);
    return;
  }

  if (oldState instanceof Date && newState instanceof Date) {
    if (oldState.getTime() !== newState.getTime()) out.push(path);
    return;
  }

  if (oldState instanceof RegExp && newState instanceof RegExp) {
    if (oldState.source !== newState.source || newState.flags !== oldState.flags) out.push(path);
    return;
  }

  // `Map` and `Set` keep their contents outside own enumerable keys, so the key-walk below sees
  // two empty objects and reports no change at all. The store treats "no changed paths" as a
  // no-op and skips the commit entirely, so a reducer returning a new Map produced no state
  // update, no subscriber notification and no error — the update simply vanished.
  //
  // Reported at this path rather than diffed internally: the references differ, which under the
  // immutability contract means the value changed. Reactivity for such a value is therefore
  // reference-level, not per-entry.
  if (oldState instanceof Map || newState instanceof Map) {
    out.push(path);
    return;
  }
  if (oldState instanceof Set || newState instanceof Set) {
    out.push(path);
    return;
  }

  const oldObj = oldState as object;
  const newObj = newState as object;

  // Cycle guard: skip a pair only when it is currently an ANCESTOR on this
  // recursion path (a genuine cycle). A pair seen earlier at a sibling path is
  // legitimate aliasing and must still be diffed.
  const active = ancestors.get(oldObj);
  if (active?.has(newObj)) return;
  const onPath = active ?? new Set<object>();
  onPath.add(newObj);
  if (!active) ancestors.set(oldObj, onPath);

  try {
    const isArrOld = Array.isArray(oldState);
    const isArrNew = Array.isArray(newState);
    if (isArrOld !== isArrNew) {
      out.push(path);
      return;
    }

    if (isArrOld) {
      const a = oldState;
      const b = newState as any[];

      // A length change reports the array path — the array's own identity changed, so a
      // subscriber watching `items` must hear about it — and then keeps going. Returning early
      // here used to be the whole story, which meant an `unshift` or `splice` notified `items`
      // and nothing beneath it: a component subscribed to the exact path `items.0.title`, the
      // very example the documentation leads with, kept rendering the previous row's title.
      // Guarded rather than filtered afterwards: at the root there is no path to report, and an
      // empty string in the output would read downstream as "the whole slice".
      if (a.length !== b.length && path) out.push(path);

      // Overlapping indices are compared as usual. With positional paths a shift genuinely
      // changes the value at nearly every index, so this is honest rather than noisy — the
      // remedy for that cost is identity-keyed state, not a diff that stays quiet.
      // The identity check happens *before* the path is built. `walk` would short-circuit on it
      // a line later anyway, but only after this frame had already concatenated a string for a
      // child that turns out to be unchanged — which for the overwhelmingly common shape of an
      // update (one element of many) is one allocation per element that nobody reads.
      const overlap = Math.min(a.length, b.length);
      for (let i = 0; i < overlap; i++) {
        if (a[i] === b[i]) continue;
        walk(a[i], b[i], path ? `${path}.${i}` : `${i}`, ancestors, out);
      }

      // Indices present in only one of the two: the element as a whole appeared or vanished,
      // which is the same treatment an added or removed object key gets below.
      for (let i = overlap; i < Math.max(a.length, b.length); i++) {
        out.push(path ? `${path}.${i}` : `${i}`);
      }

      return;
    }

    const oldKeys = Object.keys(oldState);
    const newKeys = Object.keys(newState);

    // Two distinct references with nothing enumerable to compare: any class instance holding its
    // state in private fields or behind accessors lands here. Assume changed rather than equal —
    // the alternative is the silent no-op that `Map` and `Set` used to produce, and a false
    // "changed" costs a render while a false "unchanged" costs correctness.
    if (oldKeys.length === 0 && newKeys.length === 0) {
      out.push(path);
      return;
    }

    // Whether both sides carry exactly the same keys, which is the overwhelmingly common case:
    // an update changes values, not shape. Equal counts plus one-way containment is enough to
    // conclude it — a key of `newState` missing from `oldState` would have to be balanced by a
    // key of `oldState` missing from `newState`, and the counts forbid that.
    //
    // Worth establishing because the alternative is materialising the union, and that union used
    // to be built unconditionally: two key arrays and a `Set` per object, at every level of the
    // tree. On a thousand-entity normalised map — the exact shape `createEntityAdapter` steers
    // people toward — that allocation was most of the diff's cost.
    let sameKeys = oldKeys.length === newKeys.length;
    if (sameKeys) {
      for (let i = 0; i < newKeys.length; i++) {
        if (!Object.prototype.hasOwnProperty.call(oldState, newKeys[i]!)) {
          sameKeys = false;
          break;
        }
      }
    }

    if (sameKeys) {
      for (const key of newKeys) {
        // Skip before building a path. `walk` would short-circuit on this identity a line later
        // anyway, but only after this frame had already concatenated a string for a child that
        // turns out to be unchanged — one allocation per key that nobody reads, which for the
        // common shape of an update (one field of many) is nearly all of them.
        if (oldState[key] === newState[key]) continue;
        // A key containing a dot cannot survive the join: `{ "a.b": 1 }` and `{ a: { b: 1 } }`
        // both produce "a.b", so a subscription and a devtools patch pointing at one silently
        // address the other. Nothing downstream can recover the difference from the string, which
        // is why this is said here, where the key is still intact.
        if (process.env.NODE_ENV !== "production" && key.includes(".")) warnDottedKey(path, key);
        walk(oldState[key], newState[key], path ? `${path}.${key}` : key, ancestors, out);
      }
      return;
    }

    // The shapes differ, so both sides have to be visited — but still without materialising a
    // union. Two passes over the key lists find additions and removals directly; building a
    // `Set` of every key on both sides to iterate once costs more than walking each list.
    for (const key of newKeys) {
      const hasOld = Object.prototype.hasOwnProperty.call(oldState, key);
      // Only compare values once presence is established: with differing shapes, `oldState[key]`
      // and `newState[key]` both read `undefined` for a key genuinely absent from one side, and
      // that is a change rather than a match.
      if (hasOld && oldState[key] === newState[key]) continue;
      if (process.env.NODE_ENV !== "production" && key.includes(".")) warnDottedKey(path, key);
      const nextPath = path ? `${path}.${key}` : key;
      if (!hasOld) {
        out.push(nextPath);
        continue;
      }
      walk(oldState[key], newState[key], nextPath, ancestors, out);
    }

    for (const key of oldKeys) {
      if (Object.prototype.hasOwnProperty.call(newState, key)) continue;
      if (process.env.NODE_ENV !== "production" && key.includes(".")) warnDottedKey(path, key);
      out.push(path ? `${path}.${key}` : key);
    }
  } finally {
    // Unwind: leave the current recursion path so sibling branches can revisit
    // this pair (legitimate aliasing) without being suppressed as a cycle.
    onPath.delete(newObj);
    if (onPath.size === 0) ancestors.delete(oldObj);
  }
}
