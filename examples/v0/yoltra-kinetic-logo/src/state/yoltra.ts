import { withDevtools } from "@yoltra/devtools-browser-agent";
import { createYoltra } from "@yoltra/react";

import { pixelReducer } from "./pixel/Pixel.reducer";

// One call — the store plus every typed hook. No context file, no createHooks,
// no Provider: the hooks default to the store created here. The event map is
// inferred from `pixelReducer` (a ReducerSpec<PixelState, AppEM>).
export const {
  store,
  useStore,
  useEmit,
  useEvent,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  shallowEqual,
  StoreProvider,
} = createYoltra({
  name: "YoltraPixelLogo",
  reducer: { pixel: pixelReducer },
});

// Instrument the store — streams events to the devtools hub on ws://localhost:9800.
withDevtools(store, { port: 9800 });
