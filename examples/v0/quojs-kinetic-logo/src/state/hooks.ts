import { createQuoHooks } from "@quojs/react";

import { AppStoreContext } from "../context/Store.context";
import type { AppAM, AppState } from "./types";

/**
 * Create Typed Hooks for your store */
export const {
  useStore,
  useDispatch,
  useSelector,
  useSliceProp,
  useSliceProps,
  shallowEqual,
} = createQuoHooks<keyof AppState & string, AppState, AppAM>(AppStoreContext);