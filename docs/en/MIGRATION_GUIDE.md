![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

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
const title = useAtomicProp({ reducer: "todos", property: "items.0.title" }); // 3. read one path
```

That is the whole model. Everything below is a translation of your current
library into those three moves.

---

## Concept map

| Concept              | Redux / RTK              | Zustand            | Jotai                 | Yoltra                                  |
| -------------------- | ------------------------ | ------------------ | --------------------- | --------------------------------------- |
| Define state         | `createSlice`            | `create(set => …)` | `atom(initial)`       | reducer slice in `createYoltra`         |
| Change state         | `dispatch(action)`       | `set(...)`         | `set(atom, v)`        | `emit(channel, type, payload)`          |
| State update logic   | reducer (switch)         | inline in `set`    | write atom            | reducer (pure `(state, event) => next`) |
| Read state           | `useSelector`            | `useStore(sel)`    | `useAtomVal(atom)`    | `useAtomicProp` (fine-grained)          |
| Derived value        | `reselect`               | selector fn        | derived `atom`        | `useAtomicProps(specs, selector)`       |
| Async / side effects | thunk / RTK Query / saga | inside actions     | `atomWith... `        | **effect** (`effects: [...]`)           |
| Intercept / guard    | middleware               | (manual)           | (manual)              | **middleware** (sync, can reject)       |
| Provider             | required                 | not needed         | required (`Provider`) | optional (hooks default to the store)   |

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
import { eventKeys } from "@yoltra/core";
import { createYoltra } from "@yoltra/react";

export type AppEM = { counter: { increment: number; reset: null } };

export const { useAtomicProp, useEmit } = createYoltra({
  name: "App",
  reducer: {
    counter: {
      state: { value: 0 },
      when: { keys: eventKeys<AppEM>()([["counter", "increment"], ["counter", "reset"]]) },
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
const value = useAtomicProp({ reducer: "counter", property: "value" });
const emit = useEmit();
emit("counter", "increment", 1);
```

### Thunks → effects

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


### RTK Query → nothing, and that is the honest answer

There is no counterpart, because Yoltra is a state container and RTK Query is a data-fetching
layer. It gives you a request cache, deduplication, tag-based invalidation, refetch on focus and
reconnect, polling, optimistic updates and generated hooks. None of that is state management,
and rebuilding it on effects is a project rather than a migration.

**The usual answer is to keep it.** RTK Query needs a Redux store, so keeping it means keeping
that store — which is fine, and is what the section below on adopting Yoltra incrementally is
about. Server data stays where it is; the state that is genuinely yours moves.

If you would rather not keep Redux at all, [TanStack Query](https://tanstack.com/query) does the
same job without one, and composes with Yoltra the same way: it owns the server cache, Yoltra
owns everything else.

Building it yourself is the option to reach for last. The pieces are here — effects fetch,
`createEntityAdapter` gives you a normalized cache, and the dedup window collapses duplicate
emits — but request deduplication, cache invalidation and refetch policy are the hard parts, and
they are hard wherever you write them:

```ts
const articles = createEntityAdapter<Article>();

effects: [
  {
    when: { keys: [["articles", "requested"]] },
    effect: async (event, getState, emit) => {
      // Already have it, and it is fresh enough? Then this is a no-op.
      if (articles.selectById(getState().articles, event.payload.id) !== undefined) return;
      await emit("articles", "loaded", await api.getArticle(event.payload.id));
    },
  },
],
```

That is a cache. It is not invalidation, and it is not a refetch policy. Write those only if you
know you want them.

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
      when: { keys: eventKeys<AppEM>()([["counter", "increment"], ["counter", "reset"]]) },
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
const value = useAtomicProp({ reducer: "counter", property: "value" });
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
const count = useAtomicProp({ reducer: "counter", property: "value" });
const doubled = useAtomicProp({ reducer: "counter", property: "value" }, (v) => v * 2);

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

## Adopting it beside what you have

You do not have to choose. Two stores can run in the same application without knowing about each
other, which is how a migration gets done in daylight rather than in one enormous branch.

The [`yoltra-in-react` example](../../examples/v0/yoltra-in-react) is built exactly this way: the
same todo application implemented twice, `src/state/redux` beside `src/state/yoltra` and
`src/components/redux` beside `src/components/yoltra`, running side by side in one page. It
exists to compare the two, but the arrangement is the same one an incremental adoption uses.

**Pick a bounded slice and move it whole.** A feature whose state nothing else reads — a filter
panel, a wizard, a settings drawer — is a good first move. Half a slice in each library is the
one arrangement to avoid: two owners of the same value means the two disagree, and which one is
right depends on which rendered last.

```tsx
// Redux keeps what it already owns.
<Provider store={reduxStore}>
  <App>
    <LegacyDashboard />         {/* useSelector, dispatch */}
    <StoreProvider store={yoltraStore}>
      <NewSettingsPanel />      {/* useAtomicProp, useEmit */}
    </StoreProvider>
  </App>
</Provider>
```

**Prefer no bridge.** If the slices are genuinely disjoint, the two stores never need to talk,
and adding a bridge creates the coupling the split was meant to avoid.

When one genuinely must react to the other, make the dependency one-directional and put it in an
effect:

```ts
// Yoltra hears about something Redux owns. One direction only.
effects: [
  {
    when: { keys: [["session", "endedElsewhere"]] },
    effect: async (_event, _getState, emit) => {
      await emit("settings", "cleared", null);
    },
  },
],

// Somewhere in the Redux side, once:
reduxStore.subscribe(() => {
  if (!selectIsAuthenticated(reduxStore.getState())) {
    void yoltraStore.emit("session", "endedElsewhere", null);
  }
});
```

Two bridges pointing at each other is a loop, and a loop between two stores is a bug that
reproduces only under timing you cannot control. If you find yourself wanting the second one,
move the shared state into one store instead.

---

## Persistence: replacing redux-persist

`@yoltra/core` ships `hydrate` and `persist`. The shape differs from redux-persist in one way
worth understanding before you port anything.

**The store is born hydrated.** redux-persist rehydrates an existing store by dispatching a
`REHYDRATE` action, so every reducer has to tolerate its state being replaced from underneath it
and the UI renders once with defaults before the real values arrive. Yoltra reads the payload
*first* and uses it as the reducers' initial state, so there is no flash, no synthetic action,
and no transition for effects to observe that never happened:

```ts
import {
  createStore, createWebStorageAdapter, hydrate, persist, withHydration,
} from "@yoltra/core";

const adapter = createWebStorageAdapter(localStorage);
const hydration = await hydrate({ key: "app", adapter, version: 3 });

const store = createStore({
  name: "App",
  reducer: withHydration({ todos: todosSpec, ui: uiSpec }, hydration),
});

// Persist only what is worth persisting. A change to an unwatched slice costs nothing.
const stop = persist(store, { key: "app", adapter, version: 3, slices: ["todos"] });
```

| redux-persist                               | Yoltra                                         |
| ------------------------------------------- | ---------------------------------------------- |
| `persistReducer` wraps each reducer         | `withHydration` supplies initial state         |
| `PersistGate` hides the UI until rehydrated | nothing to hide — the first render is hydrated |
| `migrate` keyed on a version number         | `migrate(persisted, fromVersion)`, same idea   |
| `whitelist` / `blacklist`                   | `slices: ["todos"]`                            |
| `transforms`                                | `serialize`, plus the codec below              |
| storage engines                             | `PersistenceAdapter`, three shipped            |

**A version mismatch is refused, not trusted.** Reducers change, and a snapshot written against
an older shape may not be valid state for this build at all. Supply `migrate` to upgrade it, or
it is discarded and you start from your declared defaults.

**Nothing throws on boot.** A missing, unparseable or unmigratable payload falls back to those
defaults and reports through `onError`. A store that will not start because `localStorage` holds
stale JSON is worse than one that starts fresh, and a full disk should not take down the page it
is persisting.

**`Map`, `Set`, `Date`, `BigInt` and circular references survive the round trip.**
`JSON.stringify` does not fail on a `Map`; it silently turns it into `{}`, which is the kind of
data loss you find months later.

For a server render, `dehydrate(store, { version })` produces the payload and
`hydrate({ source, version })` consumes it.

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
- [`yoltra-in-react`](../../examples/v0/yoltra-in-react) — the same app in Redux and in Yoltra, side by side
- [@yoltra/core API](../../packages/core/README.md) · [@yoltra/react API](../../packages/react/README.md)
- [Library Comparison](./design/state-management-library-comparison.md) — the honest architectural trade-offs
