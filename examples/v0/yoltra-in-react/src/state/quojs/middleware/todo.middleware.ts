import type { MiddlewareFunction, DeepReadonly } from "@yoltra/core";
import type { RootReducerState, tAppEM } from "../store";

/**
 * Async middleware for handling todo fetch events.
 * 
 * @remarks
 * - Intercepts `fetchTodos` events and orchestrates the async fetch lifecycle
 * - Emits loading/success/failure events based on fetch outcome
 * - Cancels the original `fetchTodos` event (returns `false`) to prevent reducer processing
 * 
 * @example
 * ```ts
 * // In a component:
 * emit('todo', 'fetchTodos', {
 *   url: '/api/todos',
 *   offset: 0,
 *   limit: 10,
 *   actions: {
 *     loading: { channel: 'todo', type: 'fetchTodosLoading' },
 *     success: { channel: 'todo', type: 'fetchTodosSuccess' },
 *     failure: { channel: 'todo', type: 'fetchTodosFailure' }
 *   }
 * });
 * ```
 */
export const todoMiddleware: Array<MiddlewareFunction<DeepReadonly<RootReducerState>, tAppEM>> = [
  async (_state, event, emit) => {
    // only process 'todo' channel events
    if (event.channel !== "todo") return true;

    // handle async fetch events
    if (event.type === "fetchTodos") {
      // emit loading event
      await emit(
        event.payload.actions.loading.channel,
        event.payload.actions.loading.type,
        null
      );

      try {
        // perform fetch
        const response = await fetch(
          `${event.payload.url}?offset=${event.payload.offset}&limit=${event.payload.limit}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // emit success event
        await emit(
          event.payload.actions.success.channel,
          event.payload.actions.success.type,
          { todos: data }
        );
      } catch (error) {
        // emit failure event
        const errorMessage = error instanceof Error ? error.message : String(error);

        await emit(
          event.payload.actions.failure.channel,
          event.payload.actions.failure.type,
          { error: errorMessage }
        );
      }

      // cancel the original fetchTodos event (already handled)
      return false;
    }

    // allow all other events to propagate
    return true;
  },
];