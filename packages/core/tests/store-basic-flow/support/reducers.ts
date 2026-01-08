import type { ReducerSpec, EventMapBase } from "../../../src/types";

export type CounterState = { value: number };
export type Todo = { id: string; title: string };
export type TodosState = { items: Todo[] };

export type AppState = {
  counter: CounterState;
  todos: TodosState;
};

export type AppEvents = {
  ui: {
    increment: number;
    setTitle: { id: string; title: string };
  };
};

export const counterReducerSpec: ReducerSpec<CounterState, AppEvents> = {
  state: { value: 0 },
  events: [["ui", "increment"]],
  reducer(state, event) {
    if (event.channel === "ui" && event.type === "increment") {
      return { value: state.value + (event.payload as number) };
    }
    return state;
  },
};

export const todosReducerSpec: ReducerSpec<TodosState, AppEvents> = {
  state: { items: [{ id: "1", title: "First" }] },
  events: [["ui", "setTitle"]],
  reducer(state, event) {
    if (event.channel === "ui" && event.type === "setTitle") {
      const { id, title } = event.payload as { id: string; title: string };

      // Note: this intentionally clones to trigger change detection
      const next: TodosState = {
        items: state.items.map((t) => (t.id === id ? { ...t, title } : t)),
      };
      return next;
    }
    return state;
  },
};

export const reducers = {
  counter: counterReducerSpec,
  todos: todosReducerSpec,
} as const;
