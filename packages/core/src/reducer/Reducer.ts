/**
 * @module @yoltra/core
 */

import type { EventMapBase, EventUnion, ReducerFunction } from "../types";

/**
 * Thin wrapper around a pure reducer function (stateful event consumer):
 * given a state `S` and an event (from {@link EventUnion | `EventUnion<EM>`}),
 * returns the next state `S`.
 *
 * @typeParam S  - State shape handled by this reducer.
 * @typeParam EM - Event map describing the valid event keys and payload types.
 *
 * @remarks
 * - The reducer function is expected to be **pure** and **side-effect free**.
 * - Use this class when you want to pass a reducer around as a value, or to
 *   unify the reducer interface across the core API.
 *
 * @example Basic counter
 * ```ts
 * type State = { count: number };
 * type EM = { math: { add: number; set: number } };
 *
 * const rf: ReducerFunction<State, EM> = (s, evt) => {
 *   if (evt.channel === 'math' && evt.type === 'add') {
 *     return { count: s.count + evt.payload };
 *   }
 *   if (evt.channel === 'math' && evt.type === 'set') {
 *     return { count: evt.payload };
 *   }
 *   return s;
 * };
 *
 * const r = new Reducer<State, EM>(rf);
 *
 * const s0 = { count: 0 };
 * const s1 = r.reduce(s0, {
 *   channel: 'math',
 *   type: 'add',
 *   payload: 2,
 *   id: crypto.randomUUID()
 * } as EventUnion<EM>);
 * // s1.count === 2
 * ```
 *
 * @public
 */
export class Reducer<S, EM extends EventMapBase = EventMapBase> {
  /**
   * The underlying pure reducer function.
   * @internal
   */
  private readonly _reduce: ReducerFunction<S, EM>;

  /**
   * Creates a new {@link Reducer} from a pure reducer function.
   *
   * @param reduce - A function `(state, event) => nextState` that implements your update logic.
   *
   * @example
   * ```ts
   * const reducer = new Reducer<MyState, MyEM>((state, event) => {
   *   // implement your transitions here
   *   return state;
   * });
   * ```
   *
   * @public
   */
  constructor(reduce: ReducerFunction<S, EM>) {
    this._reduce = reduce;
  }

  /**
   * Applies the reducer to produce the next state.
   *
   * @param state  - Current state.
   * @param event - An event drawn from {@link EventUnion | `EventUnion<EM>`}.
   * @returns The next state produced by the underlying reducer function.
   *
   * @example
   * ```ts
 * const next = reducer.reduce(curr, someEvent as EventUnion<MyEM>);
   * ```
   *
   * @public
   */
  reduce(state: S, event: EventUnion<EM>): S {
    return this._reduce(state, event);
  }
}