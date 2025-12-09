import { createStore } from "@quojs/core";

import { themeReducer } from "@/state/theme/Theme.reducer";

export const store = createStore({
  name: "test",
  reducer: {
    theme: themeReducer,
  },
  effects: [],
  middleware: []
});

