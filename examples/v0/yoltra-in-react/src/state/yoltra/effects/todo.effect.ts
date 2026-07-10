import type { DeepReadonly, EffectSpec } from "@yoltra/core";
import { eventKeys } from "@yoltra/core";

import type { RootReducerState, tAppEM } from "../types";

/**
 * Fetch orchestration lives in an EFFECT, not middleware.
 *
 * Middleware is synchronous — it gates commits (auth, validation). Async I/O
 * belongs in effects, which are the async layer of the pipeline. When a
 * `todo/fetchTodos` event is emitted, this effect drives the
 * loading -> success/failure lifecycle. The `fetchTodos` event is a no-op for
 * the reducer; this effect does the async work. (Formerly a Redux thunk, then a
 * pre-A3 async middleware.)
 */
export const todoFetchEffect: EffectSpec<DeepReadonly<RootReducerState>, tAppEM> = {
  when: { keys: eventKeys<tAppEM>()([["todo", "fetchTodos"]]) },
  effect: async (event, _getState, emit) => {
    if (event.channel !== "todo" || event.type !== "fetchTodos") return;
    const { url, offset, limit } = event.payload;

    await emit("todo", "fetchTodosLoading", null);
    try {
      const response = await fetch(`${url}?offset=${offset}&limit=${limit}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      await emit("todo", "fetchTodosSuccess", { todos: data });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await emit("todo", "fetchTodosFailure", { error: message });
    }
  },
};
