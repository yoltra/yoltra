import { combineReducers } from "@reduxjs/toolkit";
import todo from "./todo/todo.slice";

export const rootReducer = combineReducers({
  todo,
});

export type RootReducer = ReturnType<typeof rootReducer>;
