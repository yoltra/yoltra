import type { eTodoStatus, iTodoSpec } from "../../../../types";
import { useEmit } from "../../hooks";

/**
 * This is completely NOT required — `emit` already gives you autocompletion.
 * It's here only to show how you would keep the concept of event creators. */
export function useTodoEvents() {
  const emit = useEmit();

  return {
    addTodo: (todo: iTodoSpec) => emit("todo", "addTodo", todo),
    deleteTodo: (id: string) => emit("todo", "deleteTodo", { id }),
    setTodoTitle: (id: string, title: string) => emit("todo", "setTodoTitle", { id, title }),
    setTodoCategory: (id: string, category: string) =>
      emit("todo", "setTodoCategory", { id, category }),
    setTodoStatus: (id: string, status: eTodoStatus) =>
      emit("todo", "setTodoStatus", { id, status }),

    /**
     * Wire up a simple fetch (formerly a Redux thunk). The `todo/fetchTodos`
     * event is handled by `todoFetchEffect`, which emits the
     * loading -> success/failure lifecycle. You emit a plain event, not a function. */
    fetchTodos: (
      url: string = "https://jsonplaceholder.typicode.com/todos?id=0",
      offset: number = 0,
      limit: number = 10,
    ) => emit("todo", "fetchTodos", { url, offset, limit }),
  };
}

export function useTodoFilterActions() {
  const emit = useEmit();

  return {
    setCategoryFilter: (by: string) => emit("todo", "setCategoryFilter", { by }),
    setStatusFilter: (by: eTodoStatus) => emit("todo", "setStatusFilter", { by }),
    clearFilters: () => emit("todo", "clearFilters", null),
  };
}
