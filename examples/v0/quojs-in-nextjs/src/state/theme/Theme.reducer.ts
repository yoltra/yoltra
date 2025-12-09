import type { ActionPair, ReducerSpec } from "@quojs/core";

import type { AppAM, ThemeState } from "@/state/types";

const initial: ThemeState = {
  theme: "system",
  resolved: "light",
};

const THEME_ACTIONS = [
  ["theme", "set"],
  ["theme", "resolve"],
] as const satisfies readonly ActionPair<AppAM>[];

export const themeReducer: ReducerSpec<ThemeState, AppAM> = {
  actions: [
    ...THEME_ACTIONS,
  ],
  state: initial,
  reducer: (state, action) => {
    const { channel, event, payload } = action as any;
    if (channel !== "theme") return state;

    switch (event) {
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
