import { createStore } from "@yoltra/core";
import { pixelReducer } from "./pixel/Pixel.reducer";

export const store = createStore({
  name: "YoltraPixelLogo",
  reducer: {
    pixel: pixelReducer,
  },
  effects: [],
  middleware: [],
});
