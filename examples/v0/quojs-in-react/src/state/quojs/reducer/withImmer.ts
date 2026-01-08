import { produce } from "immer";
import type { EventUnion, EventMapBase, ReducerFunction } from "@quojs/core";

/**
 * Wraps a reducer function with Immer's produce for immutable updates.
 *
 * @typeParam S - State type
 * @typeParam EM - Event map type
 * @param recipe - Immer recipe function that mutates draft state
 * 
 * @returns A proper reducer function compatible with Quo.js */
export function withImmer<S, EM extends EventMapBase>(
  recipe: (draft: S, event: EventUnion<EM>) => void | S
): ReducerFunction<S, EM> {
  return (state: S, event: EventUnion<EM>): S => {
    return produce(state, (draft) => {
      recipe(draft as S, event);
    }) as S;
  };
}