import { createQuoHooks } from "@quojs/react";

import { AppStoreContext } from "../context/Store.context";
import type { AppAM, AppState } from "./types";

export const {
  useStore,
  useDispatch,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  shallowEqual,
} = createQuoHooks<keyof AppState & string, AppState, AppAM>(AppStoreContext);