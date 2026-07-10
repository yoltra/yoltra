/**
 * @module @yoltra/react
 */

/**
 * Shallow object equality using `Object.is` per-key.
 *
 * Useful as the `isEqual` argument for `useAtomicProp` and `useAtomicProps`
 * when the derived value is a plain object. Also available from the object
 * returned by {@link createHooks} and {@link createYoltra}.
 *
 * @example
 * ```ts
 * shallowEqual({ a: 1 }, { a: 1 }); // true
 * shallowEqual({ a: 1 }, { a: 2 }); // false
 * ```
 *
 * @public
 */
export function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b) return false;

  const ka = Object.keys(a),
    kb = Object.keys(b);
  if (ka.length !== kb.length) return false;

  for (const k of ka) {
    if (!Object.is(a[k], (b as Record<string, unknown>)[k])) return false;
  }

  return true;
}
