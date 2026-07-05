import type { eTodoStatus, iTodoSpec, iTodoState, iTypiTodo } from "../../types";

/**
 * App-specific event map — every event organized by channel, with its payload.
 */
export type tAppEM = {
  todo: {
    // fetch lifecycle
    fetchTodos: { url: string; offset: number; limit: number };
    fetchTodosLoading: null;
    fetchTodosSuccess: { todos: iTypiTodo[] };
    fetchTodosFailure: { error: string };

    // crud
    addTodo: iTodoSpec;
    deleteTodo: { id: string };
    setTodoStatus: { id: string; status: eTodoStatus };
    setTodoCategory: { id: string; category: string };
    setTodoTitle: { id: string; title: string };

    // filters
    setStatusFilter: { by: eTodoStatus };
    setCategoryFilter: { by: string };
    clearFilters: null;
  };
};

/** Application state shape — a single `todo` slice. */
export type RootReducerState = { todo: iTodoState };
