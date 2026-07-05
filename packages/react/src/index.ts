/**
 * @module @yoltra/react
 */

export { StoreContext } from "./context/StoreContext";
export { StoreProvider } from "./context/StoreProvider";

export {
  shallowEqual,
  useAtomicProp,
  useAtomicProps,
  useEmit,
  useEvent,
  useSelector,
  useStore,
} from "./hooks/hooks";

export {
  clearSuspenseCache,
  invalidateAtomicProp,
  invalidateAtomicPropsByReducer,
  suspenseCache,
  useSuspenseAtomicProp,
  useSuspenseAtomicProps,
} from "./hooks/suspense";

export { createHooks } from "./hooks/createHooks";
export type { UseAtomicProp, UseAtomicProps, UseEvent, YoltraHooks } from "./hooks/createHooks";

export { createYoltra } from "./createYoltra";
export type { Yoltra } from "./createYoltra";

export type { OneOrMany, PathValue } from "./hooks/hooks";
export type { SuspenseAtomicPropOptions, SuspenseAtomicPropsOptions } from "./hooks/suspense";
