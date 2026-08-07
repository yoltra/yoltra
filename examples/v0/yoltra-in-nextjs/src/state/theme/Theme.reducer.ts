import type { ReducerSpec } from "@yoltra/core";
import { eventKeys } from "@yoltra/core";

import type { AppEM, ThemeState } from "@/state/types";

const initial: ThemeState = {
  theme: "system",
  resolved: "light",
};

export const themeReducer: ReducerSpec<ThemeState, AppEM> = {
  // v0.7.0+: Use `when` for event targeting (recommended)
  when: { keys: eventKeys<AppEM>()([
    ["theme", "set"],
    ["theme", "resolve"],
  ])},
  state: initial,
  reducer: (state, event) => {
    if (event.channel !== "theme") return state;

    // The event map declares one payload per `(channel, type)`, so each case below narrows to
    // its own payload — no casting required.
    switch (event.type) {
      case "set": {
        const theme = event.payload.theme;
        const systemPref =
          window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        const resolved = theme === "system" ? systemPref : theme;

        return {
          ...state,
          theme,
          resolved
        };
      }

      case "resolve": {
        const resolved = state.theme === "system" ? event.payload.systemPref : state.theme;

        return {
          ...state,
          resolved,
        };
      }

      default:
        return state;
    }
  },
};
