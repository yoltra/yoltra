/**
 * @module @yoltra/core
 */

import type { DeepReadonly } from "../types";

/**
 * Deep-freezes a value **in place** and returns it as {@link DeepReadonly | `DeepReadonly<T>`}.
 *
 * @typeParam T - The input value type to freeze.
 * @param obj - Any value; objects and arrays are frozen recursively.
 * @param seen - (Advanced) A `WeakSet` used to track visited objects for cycle/alias safety.
 * @returns The **same** reference as `obj`, but frozen and typed as `DeepReadonly<T>`.
 *
 * @remarks
 * - **In-place**: this function mutates the input by freezing it and its children, then returns it.
 * - **Early exits**:
 *   - Primitives and `null` are returned as-is.
 *   - Already-frozen objects (`Object.isFrozen(obj)`) are returned as-is.
 *   - Previously seen objects (by identity) are returned as-is to avoid infinite recursion on cycles.
 * - **Arrays**: freezes each element, then `Object.freeze(array)`. Length/property descriptors are not rewritten.
 * - **Objects**: iterates **own** string and symbol keys. Only **data properties** are recursed (getters/setters are skipped).
 * - **Strict mode**: Mutating a frozen object throws; in non-strict mode it is a no-op (per JS semantics).
 *
 * @example Basic usage
 * ```ts
 * const state = { user: { name: 'Ada' }, items: [1, { id: 1 }] };
 * const frozen = freezeState(state);
 *
 * Object.isFrozen(frozen);                 // true
 * Object.isFrozen(frozen.user);            // true
 * Object.isFrozen(frozen.items);           // true
 * Object.isFrozen(frozen.items[1]);        // true
 * ```
 *
 * @example Safe with cycles
 * ```ts
 * const a: any = {};
 * a.self = a;              // cycle
 * freezeState(a);          // does not recurse infinitely
 * ```
 *
 * @example Already frozen objects are returned as-is
 * ```ts
 * const o = Object.freeze({ x: 1 });
 * const out = freezeState(o);
 * out === o;               // true
 * ```
 *
 * @public
 */
export function freezeState<T>(
  obj: T,
  seen = new WeakSet<object>(),
  alias?: AliasWatch,
): DeepReadonly<T> {
  if (obj === null || typeof obj !== "object") return obj as any;
  if (seen.has(obj as any)) return obj as any;

  // Reported before the early-exit on already-frozen values, so a payload stored twice is still
  // named the second time.
  if (alias !== undefined && obj === alias.watch) alias.onFound();

  if (Object.isFrozen(obj)) return obj as any;

  seen.add(obj as any);

  // Arrays: handle indices only (skip length descriptor churn)
  if (Array.isArray(obj)) {
    const arr = obj as unknown as any[];
    for (let i = 0; i < arr.length; i++) {
      arr[i] = freezeState(arr[i], seen, alias);
    }
    return Object.freeze(arr) as any;
  }

  // Plain objects: freeze string and symbol props (value descriptors only)
  for (const key of Object.getOwnPropertyNames(obj)) {
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    if (!desc || !("value" in desc)) continue; // skip getters/setters
    (obj as any)[key] = freezeState((obj as any)[key], seen, alias);
  }
  for (const sym of Object.getOwnPropertySymbols(obj)) {
    const desc = Object.getOwnPropertyDescriptor(obj, sym);
    if (!desc || !("value" in desc)) continue;
    (obj as any)[sym as any] = freezeState((obj as any)[sym as any], seen, alias);
  }

  return Object.freeze(obj) as any;
}

/**
 * Watches the freeze walk for one specific reference.
 *
 * @remarks
 * Exists to turn a dev-only heisenbug into a named warning. Because the freeze is deep and
 * in place, anything a reducer stores **by reference** is frozen too — the event payload, a
 * module-level default, a cached response. Mutating that object afterwards then throws, only in
 * development, from a stack that has nothing to do with the store, and the same code works in
 * production because the freeze is compiled out.
 *
 * Freezing it is not the mistake: an object reachable from state genuinely must not be mutated,
 * or state changes behind the store's back. Keeping the reference is. The walk already visits
 * every node, so recognising one of them costs an identity comparison and lets the store say so
 * at the moment it happens.
 *
 * @public
 */
export interface AliasWatch {
  /** The reference to look for while freezing. */
  readonly watch: object;
  /** Called if `watch` is reachable from the value being frozen. */
  readonly onFound: () => void;
}