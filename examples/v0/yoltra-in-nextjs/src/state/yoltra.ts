import { createYoltra } from "@yoltra/react";

import { themeReducer } from "@/state/theme/Theme.reducer";

// One call — the store plus every typed hook. No context file, no createHooks,
// no Provider: the hooks default to the store created here.
//
// Note: this is a module-level singleton, which is the right shape for a
// client-interactivity demo (theme toggling). Per-request store isolation for
// SSR is intentionally out of scope for this client-focused example.
export const {
  store,
  useStore,
  useEmit,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  shallowEqual,
  StoreProvider,
} = createYoltra({
  name: "YoltraNextTheme",
  reducer: { theme: themeReducer },
});
