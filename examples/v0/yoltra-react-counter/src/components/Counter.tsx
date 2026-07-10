import { useAtomicProp, useEmit } from "../state/yoltra";

export function Counter() {
  // Typed accessor — `s` autocompletes the slice shape, `value` is inferred as
  // number. Re-renders only when counter.value changes; no selectors, no memo.
  const value = useAtomicProp("counter", (s) => s.value);
  const emit = useEmit();

  return (
    <div>
      <h1>Count: {value}</h1>
      <button onClick={() => emit("counter", "increment", 1)}>+</button>
      <button onClick={() => emit("counter", "decrement", 1)}>-</button>
      <button onClick={() => emit("counter", "reset", null)}>Reset</button>
    </div>
  );
}
