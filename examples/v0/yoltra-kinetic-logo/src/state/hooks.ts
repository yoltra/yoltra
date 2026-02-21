import { createQuoHooks } from "@yoltra/react";
import { AppStoreContext } from "../context/Store.context";
import type { AppEM, AppState } from "./types";

/** Typed Yoltra hooks bound to this application's store and event map. */
export const {
  useStore,
  useEmit,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  shallowEqual,
} = createQuoHooks<keyof AppState & string, AppState, AppEM>(AppStoreContext);
