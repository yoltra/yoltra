import { todoSpec } from "./todo/todo.reducer";

/**
 * Root reducer map */
export const rootReducer = {
    todo: todoSpec,
} as const;
