import { useEmit } from "@quojs/react";
import type { iAsyncEvents, tAppAM } from "../../store";
import type { eTodoStatus, iTodoSpec } from "../../../../types";

/**
 * This is completely NOT required, since emit directly gives you autocompletion.
 * It's just here to show how you would keep using the concept of action creators. */
export function useTodoEvents() {
    const emit = useEmit<tAppAM>();

    return {
        addTodo: (todo: iTodoSpec) => emit("todo", "addTodo", todo),
        deleteTodo: (id: string) => emit("todo", "deleteTodo", { id }),
        setTodoTitle: (id: string, title: string) => emit("todo", "setTodoTitle", { id, title }),
        setTodoCategory: (id: string, category: string) => emit("todo", "setTodoCategory", { id, category }),
        setTodoStatus: (id: string, status: eTodoStatus) => emit("todo", "setTodoStatus", { id, status }),

        /**
         * Perhaps this is the only important example: how to wire-up a simple
         * fetch action (formerly Thunk)?.
         * 
         * In this example, the fetchTodos action is going to be intercepted by `todoMiddleware`,
         * which then will swallow the action and emit a combination of the ones declared in `actions`,
         * depending on the result. It's basically the same as you would do in good-old Redux + Thunk,
         * except you don't dipatch functions, you emit plain actions. */
        fetchTodos: (url: string = "https://jsonplaceholder.typicode.com/todos?id=0", offset: number = 0, limit: number = 10) => {
            const actions: iAsyncEvents<tAppAM> = {
                loading: {
                    channel: "todo",
                    type: "fetchTodosLoading",
                },
                success: {
                    channel: "todo",
                    type: "fetchTodosSuccess",
                    payload: { todos: [] }
                },
                failure: {
                    channel: "todo",
                    type: "fetchTodosFailure",
                    payload: { error: "" }
                },
            };

            emit("todo", "fetchTodos", { offset, limit, url, actions });
        }
    };
};

export function useTodoFilterActions() {
    const emit = useEmit<tAppAM>();

    return {
        setCategoryFilter: (by: string) => emit("todo", "setCategoryFilter", { by }),
        setStatusFilter: (by: eTodoStatus) => emit("todo", "setStatusFilter", { by }),
        clearFilters: () => emit("todo", "clearFilters", null),
    };
};
