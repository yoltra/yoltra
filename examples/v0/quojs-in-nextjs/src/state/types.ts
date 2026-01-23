import type React from "react";
import type { StoreInstance } from "@quojs/core";

export type ThemeName = "light" | "dark" | "system";

/**
 * Theme State
 * 
 * Describes the shape of the theme state. */
export interface ThemeState {
  theme: ThemeName;             // user's choice
  resolved: "light" | "dark";   // effective theme after system resolution
}

/**
 * Theme reducer event map.
 *
 * Describes the set of events and their payloads
 * for the theme channel. */
export type ThemeEM = {
  // set the specified theme
  set: { theme: "light" | "dark" | "system" };

  // infer which theme to use considering system prefs
  resolve: { systemPref: "light" | "dark" };
};

// Application state shape
export interface AppState {
  theme: ThemeState;
}

// Application event map
export type AppEM = {
  theme: ThemeEM;
};

export type AppStore = StoreInstance<keyof AppState & string, AppState, AppEM>;
