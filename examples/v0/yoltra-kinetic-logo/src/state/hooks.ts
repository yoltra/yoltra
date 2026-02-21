import { createQuoHooks } from "@yoltra/react";

import { AppStoreContext } from "../context/Store.context";
import type { AppEM, AppState } from "./types";

/**
 * Create Typed Hooks for your store */
export const {
  useStore,
  useEmit,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  shallowEqual,
} = createQuoHooks<keyof AppState & string, AppState, AppEM>(AppStoreContext);