import { createStore, eventKeys } from "@yoltra/core";

export type AppEM = {
  counter: {
    increment: number;
    decrement: number;
    reset: null;
  };
};

export type AppState = { counter: { value: number } };

export const store = createStore<AppState, AppEM>({
  name: "App",
  reducer: {
    counter: {
      state: { value: 0 },
      when: {
        keys: eventKeys<AppEM>()([
          ["counter", "increment"],
          ["counter", "decrement"],
          ["counter", "reset"],
        ]),
      },
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
    },
  },
});
