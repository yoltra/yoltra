![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Migration Guide

> 👉 English &nbsp;|&nbsp; [🇲🇽 Español](../es/MIGRATION_GUIDE.md)

Coming from Redux, Zustand, or Jotai? This guide maps the concepts you already know onto Yoltra and
shows one before/after; the full guide has a translation for each library.

> **Full guide:** [Migration on yoltra.dev](https://yoltra.dev/en/yoltra/docs/migration/)

## The one shift to internalize

Yoltra is **event-sourced**. You don't `set` state directly: you **`emit` an event**
`(channel, type, payload)`, and a **pure reducer** computes the next state. Reads are
**fine-grained path subscriptions**: a component re-renders only when the exact leaf it reads
changes. Async work lives in **effects**.

```tsx
emit("todos", "add", { title: "Buy milk" }); // 1. emit an event
// 2. a reducer computes the next state (synchronously)
const title = useAtomicProp({ reducer: "todos", property: "items.0.title" }); // 3. read one path
```

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

## From Redux / Redux Toolkit

**Mapping:** `action → event`, `dispatch → emit`, `slice reducer → reducer`,
`useSelector → useAtomicProp`, `thunk / RTK Query → effect`,
`middleware → middleware (sync) or effect (async)`.

```tsx
// Redux
const value = useSelector((s: RootState) => s.counter.value);
const dispatch = useDispatch();
dispatch(increment(1));
```

```tsx
// Yoltra: re-renders only when counter.value changes; no memo, no reselect
const value = useAtomicProp({ reducer: "counter", property: "value" });
const emit = useEmit();
emit("counter", "increment", 1);
```

Thunks become **effects**, which run after the reducer and emit follow-up events. RTK Query has no
counterpart, because it is a data-fetching layer: keep it (with its Redux store) or use TanStack
Query beside Yoltra. Yoltra middleware is **synchronous**, and only an explicit `false` rejects an
event, which becomes an "uncommitted" event your UI can react to.

## More on yoltra.dev

- [Redux in full](https://yoltra.dev/en/yoltra/docs/migration/#from-redux--redux-toolkit): store and slice, [thunks to effects](https://yoltra.dev/en/yoltra/docs/migration/#thunks--effects), [RTK Query](https://yoltra.dev/en/yoltra/docs/migration/#rtk-query--nothing-and-that-is-the-honest-answer), [middleware](https://yoltra.dev/en/yoltra/docs/migration/#middleware).
- [From Zustand](https://yoltra.dev/en/yoltra/docs/migration/#from-zustand): `create(set => …) → createYoltra`, `set(...) → emit + reducer`, `useStore(selector) → useAtomicProp`.
- [From Jotai](https://yoltra.dev/en/yoltra/docs/migration/#from-jotai): an `atom` is a **path** in a slice; derived atoms become `useAtomicProps(specs, selector)`; `useSetAtom → useEmit`.
- [Adopting it beside what you have](https://yoltra.dev/en/yoltra/docs/migration/#adopting-it-beside-what-you-have): two stores in one app, move a bounded slice whole, bridge one way through an effect.
- [Persistence: replacing redux-persist](https://yoltra.dev/en/yoltra/docs/migration/#persistence-replacing-redux-persist): `hydrate` and `persist`; the store is born hydrated, a version mismatch needs `migrate`, nothing throws on boot.
- [Gotchas & FAQ](https://yoltra.dev/en/yoltra/docs/migration/#gotchas--faq): no `setState` by design, reducers stay pure, `getState()` is correct right after `emit()`, a Provider is optional, channels namespace events by domain.

## Next steps

- [Quick Start Guide](./QUICK_START_GUIDE.md): install to working app in three steps
- [Testing Guide](./TESTING_GUIDE.md): unit-test stores, effects, and components
- [`yoltra-in-react`](../../examples/v0/yoltra-in-react): the same app in Redux and in Yoltra, side by side
- [@yoltra/core API](../../packages/core/README.md) · [@yoltra/react API](../../packages/react/README.md)
- [Library Comparison](./design/state-management-library-comparison.md): the architectural trade-offs

> **Full guide:** [Migration on yoltra.dev](https://yoltra.dev/en/yoltra/docs/migration/)
