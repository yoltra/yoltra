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
 * Theme reducer action map.
 * 
 * Descrives the set of events and their payloads
 * for the theme channel. */
export type ThemeAM = {
  // set the specified theme
  set: { theme: "light" | "dark" | "system" };

  // infer which theme to use considering system prefs
  resolve: { systemPref: "light" | "dark" };
};

// Application state shape
export interface AppState {
  theme: ThemeState;
}

// Application action map
export type AppAM = {
  theme: ThemeAM;
};

export type AppStore = StoreInstance<keyof AppState & string, AppState, AppAM>;
