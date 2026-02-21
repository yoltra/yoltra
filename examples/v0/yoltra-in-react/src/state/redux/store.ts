import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "./reducer";
import { todoMiddleware } from "./middleware/todo.middleware";

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault({ serializableCheck: false, immutableCheck: false }).concat(
      todoMiddleware
    ),
});

// Inferred types
export type AppStore = typeof store;
export type AppDispatch = AppStore["dispatch"];
export type AppState = ReturnType<AppStore["getState"]>;