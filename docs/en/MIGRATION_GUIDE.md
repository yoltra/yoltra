![Yoltra logo](../../assets/yoltra-logo.png)

# Migration Guide

> 👉 English &nbsp;|&nbsp; [🇲🇽 Español](../es/MIGRATION_GUIDE.md)

Coming from Redux, Zustand, or Jotai? This guide maps the concepts you already
know onto Yoltra and shows the before/after for each.

---

## The one shift to internalize

Yoltra is **event-sourced**. You don't `set` state directly — you **`emit` an
event** `(channel, type, payload)`, and a **pure reducer** computes the next
state. Reads are **fine-grained path subscriptions**: a component re-renders
only when the exact leaf it reads changes. Async work lives in **effects**.

```tsx
emit("todos", "add", { title: "Buy milk" }); // 1. emit an event
// 2. a reducer computes the next state (synchronously)
const title = useAtomicProp("todos", (s) => s.items[0].title); // 3. read one path
```

That is the whole model. Everything below is a translation of your current
library into those three moves.

---

## Concept map

| Concept              | Redux / RTK              | Zustand              | Jotai                | Yoltra                                   |
| -------------------- | ------------------------ | -------------------- | -------------------- | ---------------------------------------- |
| Define state         | `createSlice`            | `create(set => …)`   | `atom(initial)`      | reducer slice in `createYoltra`          |
| Change state         | `dispatch(action)`       | `set(...)`           | `set(atom, v)`       | `emit(channel, type, payload)`           |
| State update logic   | reducer (switch)         | inline in `set`      | write atom           | reducer (pure `(state, event) => next`)  |
| Read state           | `useSelector`            | `useStore(sel)`      | `useAtomVal(atom)`   | `useAtomicProp` (fine-grained)           |
| Derived value        | `reselect`               | selector fn          | derived `atom`       | `useAtomicProps(specs, selector)`        |
| Async / side effects | thunk / RTK Query / saga | inside actions       | `atomWith... `       | **effect** (`effects: [...]`)            |
| Intercept / guard    | middleware               | (manual)             | (manual)             | **middleware** (sync, can reject)        |
| Provider             | required                 | not needed           | required (`Provider`)| optional (hooks default to the store)    |

---

## From Redux / Redux Toolkit

**Mapping:** `action → event`, `dispatch → emit`, `slice reducer → reducer`,
`useSelector → useAtomicProp`, `thunk / RTK Query → effect`,
`middleware → middleware (sync) or effect (async)`.

### Store + slice

```ts
// Redux Toolkit
const counter = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: (s, a: PayloadAction<number>) => { s.value += a.payload; },
    reset: (s) => { s.value = 0; },
  },
});
export const store = configureStore({ reducer: { counter: counter.reducer } });
```

```ts
// Yoltra
import { createYoltra } from "@yoltra/react";

export type AppEM = { counter: { increment: number; reset: null } };

export const { useAtomicProp, useEmit } = createYoltra({
  name: "App",
  reducer: {
    counter: {
      state: { value: 0 },
      events: [["counter", "increment"], ["counter", "reset"]],
      reducer: (s, e) => {
        switch (e.type) {
          case "increment": return { value: s.value + e.payload };
          case "reset":     return { value: 0 };
          default:          return s;
        }
      },
    },
  },
});
```

### Dispatch → emit, useSelector → useAtomicProp

```tsx
// Redux
const value = useSelector((s: RootState) => s.counter.value);
const dispatch = useDispatch();
dispatch(increment(1));
```

```tsx
// Yoltra — re-renders only when counter.value changes; no memo, no reselect
const value = useAtomicProp("counter", (s) => s.value);
const emit = useEmit();
emit("counter", "increment", 1);
```

### Thunks / RTK Query → effects

Async belongs in **effects**, which run after the reducer and can emit follow-up
events (your success/failure actions):

```ts
// Redux thunk
const fetchTodos = () => async (dispatch) => {
  dispatch(loading());
  const res = await api.getTodos();
  dispatch(loaded(res));
};
```

```ts
// Yoltra effect
effects: [
  {
    when: { keys: [["todos", "fetch"]] },
    effect: async (event, getState, emit) => {
      const res = await api.getTodos();
      await emit("todos", "loaded", res); // reduce the result like any event
    },
  },
],
```

### Middleware

Redux middleware wraps `dispatch`. Yoltra middleware is **synchronous** and
returns a boolean — return `false` to **reject** an event (it becomes an
"uncommitted" event your UI can react to). Async middleware work moves to
effects.

```ts
middleware: [
  {
    when: { channel: "admin" },
    middleware: (state, event) => state.auth.isAdmin, // false → rejected
  },
],
```

---

## From Zustand

**Mapping:** `create(set => …) → createYoltra`, `set(...) → emit + reducer`,
`useStore(selector) → useAtomicProp`.

```ts
// Zustand
const useStore = create((set) => ({
  value: 0,
  increment: (n) => set((s) => ({ value: s.value + n })),
  reset: () => set({ value: 0 }),
}));
```

```ts
// Yoltra — state and transitions are separated: emit an event, reduce it
export const { useAtomicProp, useEmit } = createYoltra({
  name: "App",
  reducer: {
    counter: {
      state: { value: 0 },
      events: [["counter", "increment"], ["counter", "reset"]],
      reducer: (s, e) =>
        e.type === "increment" ? { value: s.value + e.payload }
        : e.type === "reset"   ? { value: 0 }
        : s,
    },
  },
});
```

```tsx
// Zustand: const value = useStore((s) => s.value); useStore.getState().increment(1);
// Yoltra:
const value = useAtomicProp("counter", (s) => s.value);
const emit = useEmit();
emit("counter", "increment", 1);
```

**Why the extra step?** The action/reducer split is what buys you the event log,
time-travel, and DevTools — Zustand's inline `set` can't be replayed or
inspected. In exchange you get fine-grained reads for free: `useAtomicProp`
re-renders on one leaf, no selector-equality tuning.

---

## From Jotai

**Mapping:** an `atom` ≈ a **path** in a slice; `useAtomValue → useAtomicProp`;
derived atoms → `useAtomicProps(specs, selector)`; `useSetAtom → useEmit`.

```ts
// Jotai
const countAtom = atom(0);
const doubledAtom = atom((get) => get(countAtom) * 2);
```

```tsx
// Jotai reads/writes
const count = useAtomValue(countAtom);
const doubled = useAtomValue(doubledAtom);
const setCount = useSetAtom(countAtom);
setCount((c) => c + 1);
```

```tsx
// Yoltra — one slice, paths are your "atoms", derivations are selectors
const count = useAtomicProp("counter", (s) => s.value);
const doubled = useAtomicProp("counter", (s) => s.value * 2);

const emit = useEmit();
emit("counter", "increment", 1);
```

For a value derived from **several** paths, use `useAtomicProps` — it re-runs
only when one of the listed paths changes:

```tsx
const filtered = useAtomicProps(
  [
    { reducer: "todos", property: "items.**" },
    { reducer: "filter", property: "q" },
  ],
  (s) => s.todos.items.filter((t) => t.title.includes(s.filter.q)),
  shallowEqual,
);
```

Jotai gives you fine-grained reactivity bottom-up (many atoms); Yoltra gives you
the same top-down (paths into slices) **plus** an event log and time-travel
DevTools that the atom model doesn't have.

---

## Gotchas & FAQ

- **"Where's `setState`?"** There isn't one by design. Emit an event; a reducer
  produces the next state. That indirection is what makes the whole history
  inspectable and replayable.
- **Reducers must be pure.** No async, no I/O, no mutation of the previous
  state — return a new value. Put async in effects.
- **`getState()` is correct right after `emit()`.** The reduce phase is
  synchronous. `await emit(...)` only when you also want *that event's* effects
  to have finished.
- **Do I need a Provider?** No — `createYoltra`'s hooks default to the store it
  created. Use `<StoreProvider>` only to scope a different instance to a subtree
  (e.g. a fresh store per test).
- **Channels?** The extra `channel` dimension namespaces events
  (`"auth"`/`"ui"`/`"todos"`) so large apps don't collide on a flat action-type
  space. Pick channels by domain.

---

## Next steps

- [Quick Start Guide](./QUICK_START_GUIDE.md) — install to working app in three steps
- [Testing Guide](./TESTING_GUIDE.md) — unit-test stores, effects, and components
- [@yoltra/core API](../../packages/core/README.md) · [@yoltra/react API](../../packages/react/README.md)
- [Library Comparison](./design/state-management-library-comparison.md) — the honest architectural trade-offs
