/**
 * @module @yoltra/core
 */

/**
 * Brand identifying a {@link Rejection}.
 *
 * @remarks
 * `Symbol.for` rather than `Symbol()`, so the brand survives two copies of this package meeting
 * at runtime — a duplicated dependency, a bundle that inlined a second copy, a consumer that
 * pinned an older minor. With a unique symbol the check would silently answer `false` across that boundary and a
 * refusal would read as ordinary state, which is the failure this whole feature exists to end.
 *
 * @internal
 */
const REJECTED = Symbol.for("yoltra.rejected");

/**
 * A reducer's refusal to apply a write, carrying the reason.
 *
 * @remarks
 * Distinct from a reducer returning its state unchanged, which is indistinguishable from "the
 * event did not concern me". A `Rejection` says *this write was considered and declined*, and it
 * says why — which is what a contended store needs and what a lost update otherwise costs.
 *
 * @public
 */
export interface Rejection {
  readonly [REJECTED]: true;
  /** Why the write was refused. Surfaced to the caller and to `onRejected`. */
  readonly reason: string;
}

/**
 * Builds a {@link Rejection} for a reducer to return instead of state.
 *
 * @param reason - Why the write is refused; surfaced verbatim to the caller.
 *
 * @remarks
 * Rejecting is a whole-event act: no slice commits, no change notifications fire, and the
 * caller's `emit` resolves reporting the refusal. A reducer that merely has nothing to do should
 * return its state, not this.
 *
 * @example Compare-and-swap on a contended slice
 * ```ts
 * reducer: (state, event) =>
 *   event.payload.expectedVersion === state.version
 *     ? { ...state, ...event.payload.patch, version: state.version + 1 }
 *     : Rejected(`stale write: expected v${event.payload.expectedVersion}, have v${state.version}`)
 * ```
 *
 * @public
 */
export function Rejected(reason: string): Rejection {
  return { [REJECTED]: true, reason };
}

/**
 * Whether a reducer returned a {@link Rejection} rather than state.
 *
 * @public
 */
export function isRejected(value: unknown): value is Rejection {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { [REJECTED]?: unknown })[REJECTED] === true
  );
}
