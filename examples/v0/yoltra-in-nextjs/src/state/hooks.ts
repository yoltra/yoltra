import { createHooks } from "@yoltra/react";

import { AppStoreContext } from "../context/Store.context";
import type { AppEM, AppState } from "./types";

export const { useStore, useEmit, useSelector, useAtomicProp, useAtomicProps, shallowEqual } =
  createHooks<keyof AppState & string, AppState, AppEM>(AppStoreContext);
