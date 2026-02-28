import { createStore } from "@yoltra/core";
import { withDevtools } from "@yoltra/devtools-browser-agent";
import { pixelReducer } from "./pixel/Pixel.reducer";

export const store = createStore({
  name: "YoltraPixelLogo",
  reducer: {
    pixel: pixelReducer,
  },
  effects: [],
  middleware: [],
});

// Instrument the store — connects to hub on ws://localhost:9800
withDevtools(store, { port: 9800 });
