import type { Middleware } from "@reduxjs/toolkit";

export const todoMiddleware: Middleware = () => (next) => (action) => {
  // Example: console.debug("[RTK]", action.type, action);
  return next(action);
};