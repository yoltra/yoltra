import { eventKeys, type ReducerSpec } from "@yoltra/core";
import { createYoltra } from "@yoltra/react";

export type AppEM = {
  counter: {
    increment: number;
    decrement: number;
    reset: null;
  };
};

type CounterState = { value: number };

const counter: ReducerSpec<CounterState, AppEM> = {
  state: { value: 0 },
  when: {
    keys: eventKeys<AppEM>()([
      ["counter", "increment"],
      ["counter", "decrement"],
      ["counter", "reset"],
    ]),
  },
  // `event.payload` narrows to `number` / `null` on `event.type` — no casts.
  reducer: (state, event) => {
    switch (event.type) {
      case "increment":
        return { value: state.value + event.payload };
      case "decrement":
        return { value: state.value - event.payload };
      case "reset":
        return { value: 0 };
      default:
        return state;
    }
  },
};

// One call — the store plus every typed hook. No context file, no createHooks,
// no Provider: the hooks default to the store created here.
export const { store, useAtomicProp, useAtomicProps, useEmit, useEvent, useSelector, useStore, shallowEqual, StoreProvider } =
  createYoltra({ name: "App", reducer: { counter } });
