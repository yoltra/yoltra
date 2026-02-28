import type { StoreInstance } from "@yoltra/core";
import type { eTodoStatus, iTodoSpec, iTypiTodo } from "../../types";

import { createStore } from "@yoltra/core";
import { withDevtools } from "@yoltra/devtools-browser-agent";

import type { StateFromReducers } from "../../../../../../packages/core/dist/types/types";
import { todoMiddleware } from "./middleware";
import { rootReducer } from "./reducer";

/**
 * Helper type for async event patterns (loading/success/failure).
 *
 * @remarks
 * This is a common pattern for async operations where you want to track
 * the lifecycle of an async action with three events. */
export type iAsyncEvents<EM extends Record<string, Record<string, unknown>>> = {
  [C in keyof EM]: {
    loading: { channel: C; type: keyof EM[C]; payload?: EM[C][keyof EM[C]] };
    success: { channel: C; type: keyof EM[C]; payload?: EM[C][keyof EM[C]] };
    failure: { channel: C; type: keyof EM[C]; payload?: EM[C][keyof EM[C]] };
  };
}[keyof EM];

/**
 * App-specific Event Map
 *
 * Defines all events in the application organized by channel.
 * Each channel contains event types and their associated payloads. */
export type tAppEM = {
  todo: {
    // fetch lifecycle events
    fetchTodos: {
      url: string;
      offset: number;
      limit: number;
      actions: iAsyncEvents<tAppEM>;
    };
    fetchTodosLoading: null;
    fetchTodosSuccess: { todos: iTypiTodo[] };
    fetchTodosFailure: { error: string };

    // crud events
    addTodo: iTodoSpec;
    deleteTodo: { id: string };
    setTodoStatus: { id: string; status: eTodoStatus };
    setTodoCategory: { id: string; category: string };
    setTodoTitle: { id: string; title: string };

    // filter events
    setStatusFilter: { by: eTodoStatus };
    setCategoryFilter: { by: string };
    clearFilters: null;
  };
};

/**
 * Extracted types for the store to avoid TS2742 portability issues. */
export type RootReducerKeys = keyof typeof rootReducer & string;
export type RootReducerState = StateFromReducers<typeof rootReducer>;

/**
 * The main application store instance.
 *
 * @remarks
 * - Uses v0.5.0 `createStore` with explicit type annotation to avoid TS2742
 * - Middleware is registered at construction
 * - Type annotation ensures portability across different TypeScript setups */
export const store: StoreInstance<RootReducerKeys, RootReducerState, tAppEM> = createStore({
  name: "Yoltra Store",
  reducer: rootReducer,
  middleware: todoMiddleware,
});

// Instrument the store — connects to hub on ws://localhost:9800
withDevtools(store, { port: 9800 });

/**
 * Type of the store instance for use in type annotations. */
export type tAppStore = typeof store;

/**
 * Convenience re-export of the event map for use in components. */
export type { tAppEM as AppEventMap };
