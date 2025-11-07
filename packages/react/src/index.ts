export { StoreProvider } from "./context/StoreProvider";
export { StoreContext } from "./context/StoreContext";

export {
  useStore,
  useDispatch,
  useSelector,

  // new chingon names
  useAtomicProp,
  useAtomicProps,

  // old, slicy names
  useSliceProp,   // @deprecated Use useAtomicProp instead. Will be removed in 0.5.0.
  useSliceProps,  // @deprecated Use useAtomicProps instead. Will be removed in 0.5.0.
  
  shallowEqual,
} from "./hooks/hooks";

export {
  // new canonical atomic Suspense names
  useSuspenseAtomicProp,
  useSuspenseAtomicProps,
  invalidateAtomicProp,
  invalidateAtomicPropsByReducer,

  // old, slicy names
  useSuspenseSliceProp,          // @deprecated Use useSuspenseAtomicProp instead. Will be removed in 0.5.0.
  useSuspenseSliceProps,         // @deprecated Use useSuspenseAtomicProps instead. Will be removed in 0.5.0.
  invalidateSliceProp,           // @deprecated Use invalidateAtomicProp instead. Will be removed in 0.5.0.
  invalidateSlicePropsByReducer, // @deprecated Use invalidateAtomicPropsByReducer instead. Will be removed in 0.5.0.

  // Cache controls
  clearSuspenseCache,
  suspenseCache,
} from "./hooks/suspense";

export { createQuoHooks } from "./hooks/createQuoHooks";

// Types (for TypeDoc)
export type { PathValue, OneOrMany } from "./hooks/hooks";
export type {
  SuspenseSlicePropOptions,
  SuspenseSlicePropsOptions,
  SuspenseAtomicPropOptions,
  SuspenseAtomicPropsOptions,
} from "./hooks/suspense";

export type {
  UseAtomicProp,
  UseAtomicProps,
} from "./hooks/createQuoHooks";
