import { createStore } from "@quojs/core"

import { logoReducer } from "./logo/Logo.reducer";

export const store = createStore({
  name: "Quo.js",
  reducer: {
    logo: logoReducer,
  },
  effects: [],
  middleware: []
});

