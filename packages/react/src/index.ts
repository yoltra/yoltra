/**
 * @module @yoltra/react
 */

export { StoreContext } from "./context/StoreContext";
export { StoreProvider } from "./context/StoreProvider";

// The atomic hooks are deliberately NOT exported standalone: with no store context to infer
// from, every call site needed four explicit type parameters, and the same hooks arrive fully
// inferred from `createHooks` (or `createYoltra`). One way to do it, the good one.
export { shallowEqual, useEmit, useEvent, useSelector, useStore } from "./hooks/hooks";

export {
  clearSuspenseCache,
  invalidateAtomicProp,
  invalidateAtomicPropsByReducer,
  suspenseCache,
} from "./hooks/suspense";

export { createHooks } from "./hooks/createHooks";
export type { UseAtomicProp, UseAtomicProps, UseEvent, YoltraHooks } from "./hooks/createHooks";
export type { UseSuspenseAtomicProp, UseSuspenseAtomicProps } from "./hooks/suspense";

export { createYoltra } from "./createYoltra";
export type { Yoltra } from "./createYoltra";

export type { OneOrMany, PathValue } from "./hooks/hooks";
export type { SuspenseAtomicPropOptions, SuspenseAtomicPropsOptions } from "./hooks/suspense";

export { useEntity, useEntityField, useEntityIds } from "./entity/useEntity";
