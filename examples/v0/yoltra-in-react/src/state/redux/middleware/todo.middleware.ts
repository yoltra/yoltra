import type { Middleware } from "@reduxjs/toolkit";

export const todoMiddleware: Middleware = (_store) => (next) => (action) => {
  // Example: console.debug("[RTK]", action.type, action);
  return next(action);
};