/**
 * The typed hooks are created by `createYoltra` in ./store and bound to that
 * store. They are re-exported here so existing imports (state/yoltra/hooks)
 * keep working — all fed by the single store, no Provider required.
 */
export {
  useStore,
  useEmit,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  useEvent,
} from "./store";
