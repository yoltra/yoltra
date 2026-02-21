import { createStore } from "@yoltra/core"

import { logoReducer } from "./logo/Logo.reducer";

export const store = createStore({
  name: "Yoltra",
  reducer: {
    logo: logoReducer,
  },
  effects: [],
  middleware: []
});

