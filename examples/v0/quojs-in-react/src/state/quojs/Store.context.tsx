import { createContext, type Context } from "react";
import type { StoreInstance } from "@quojs/core";
import type { tAppEM, RootReducerKeys, RootReducerState } from "./store";

/**
 * Type for the app store instance. */
type AppStoreInstance = StoreInstance<RootReducerKeys, RootReducerState, tAppEM>;

/**
 * React Context for the Quo.js store instance. */
export const AppStoreContext: Context<AppStoreInstance | null> = 
  createContext<AppStoreInstance | null>(null);