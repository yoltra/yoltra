import { createContext } from "react";

import type { StoreInstance } from "@yoltra/core";
import { createHooks } from "@yoltra/react";
import type { AppEM, AppState } from "./store";

export const AppStoreContext = createContext<StoreInstance<"counter", AppState, AppEM> | null>(
  null,
);

export const { useAtomicProp, useEmit, useEvent, useSelector, shallowEqual } =
  createHooks(AppStoreContext);
