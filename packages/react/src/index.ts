/**
 * @module @quojs/react
 */

export { StoreProvider } from "./context/StoreProvider";
export { StoreContext } from "./context/StoreContext";

export {
  useStore,
  useEmit,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  shallowEqual,
} from "./hooks/hooks";

export {
  useSuspenseAtomicProp,
  useSuspenseAtomicProps,
  invalidateAtomicProp,
  invalidateAtomicPropsByReducer,
  clearSuspenseCache,
  suspenseCache,
} from "./hooks/suspense";

export { createQuoHooks } from "./hooks/createQuoHooks";

export type { PathValue, OneOrMany } from "./hooks/hooks";
export type { SuspenseAtomicPropOptions, SuspenseAtomicPropsOptions } from "./hooks/suspense";
export type { UseAtomicProp, UseAtomicProps } from "./hooks/createQuoHooks";