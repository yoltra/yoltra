import { useDispatch } from "react-redux";
import type { AppDispatch } from "./store";

import {
    addTodo,
    deleteTodo,
    setTodoTitle,
    setTodoCategory,
    setTodoStatus,
    setCategoryFilter,
    setStatusFilter,
    clearFilters,
    fetchTodos,
    type FetchTodosArgs,
} from "./reducer/todo/todo.slice";

import type { eTodoStatus, iTodoSpec } from "../../types";
import type { ChangeEvent } from "react";

export function useTodoActions() {
    const dispatch = useDispatch<AppDispatch>();

    return {
        addTodo: (todo: iTodoSpec) =>
            dispatch(addTodo(todo as any)),
        deleteTodo: (id: string) => dispatch(deleteTodo({ id })),
        setTodoTitle: (id: string, title: string) =>
            dispatch(setTodoTitle({ id, title })),
        setTodoCategory: (id: string, category: string) =>
            dispatch(setTodoCategory({ id, category })),
        setTodoStatus: (id: string, status: eTodoStatus) =>
            dispatch(setTodoStatus({ id, status })),
        fetchTodos: (
            url: string = "https://jsonplaceholder.typicode.com/todos?id=0?offset=0&limit=10",
            offset: number = 0,
            limit: number = 10
        ) => dispatch(fetchTodos({ url, offset, limit } as FetchTodosArgs)),
    };
}

export function useTodoFilterActions() {
    const dispatch = useDispatch<AppDispatch>();

    return {
        setCategoryFilter: ({ target }: ChangeEvent<HTMLSelectElement>) => dispatch(setCategoryFilter({ by: target.value })),
        setStatusFilter: ({ target }: ChangeEvent<HTMLSelectElement>) => dispatch(setStatusFilter({ by: target.value as unknown as eTodoStatus })),
        clearFilters: () => dispatch(clearFilters()),
    };
}
