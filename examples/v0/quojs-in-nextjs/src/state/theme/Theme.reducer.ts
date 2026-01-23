import type { EventKey, ReducerSpec } from "@quojs/core";

import type { AppEM, ThemeState } from "@/state/types";

const initial: ThemeState = {
  theme: "system",
  resolved: "light",
};

export const themeReducer: ReducerSpec<ThemeState, AppEM> = {
  events: [
    ["theme", "set"],
    ["theme", "resolve"],
  ],
  state: initial,
  reducer: (state, event) => {
    const { channel, type, payload } = event as any;
    if (channel !== "theme") return state;

    switch (type) {
      case "set": {
        const theme = payload.theme;
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
        const resolved = (state.theme === "system" ? payload.systemPref : state.theme) as "light" | "dark";

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
