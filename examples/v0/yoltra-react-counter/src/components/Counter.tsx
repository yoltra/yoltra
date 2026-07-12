import { Button } from "@yoltra/ds";
import { useAtomicProp, useEmit } from "../state/yoltra";

export function Counter() {
  // Typed accessor — `s` autocompletes the slice shape, `value` is inferred as
  // number. Re-renders only when counter.value changes; no selectors, no memo.
  const value = useAtomicProp("counter", (s) => s.value);
  const emit = useEmit();

  return (
    <div className="counter-card">
      <span className="counter-card__label">counter.value</span>
      <output className="counter-card__value">{value}</output>
      <div className="counter-card__actions">
        <Button variant="ghost" onClick={() => emit("counter", "decrement", 1)} aria-label="Decrement">
          −
        </Button>
        <Button variant="ghost" size="sm" onClick={() => emit("counter", "reset", null)}>
          Reset
        </Button>
        <Button variant="primary" onClick={() => emit("counter", "increment", 1)} aria-label="Increment">
          +
        </Button>
      </div>
    </div>
  );
}
