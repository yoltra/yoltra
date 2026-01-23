import { createQuoHooks } from "@quojs/react";

import { AppStoreContext } from "../context/Store.context";
import type { AppEM, AppState } from "./types";

export const {
  useStore,
  useEmit,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  shallowEqual,
} = createQuoHooks<keyof AppState & string, AppState, AppEM>(AppStoreContext);