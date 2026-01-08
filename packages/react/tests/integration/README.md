# React + @quojs/core Integration Test Suite

## Purpose

This suite validates that `@quojs/react` integrates correctly with a real `@quojs/core` store instance.

Mock stores validate hook semantics.  
Integration tests validate store + hook + Provider semantics end-to-end.

---

## Scenarios Tested

### ✓ Real reducer updates flow through atomic selectors

The core scenario is:

1. A real store is created via `createStore` from `@quojs/core`.
2. A `StoreProvider` wraps a React component using:
   - `useAtomicProp` to select a value from the store.
   - `useEmit` to dispatch events.
3. When the component triggers `emit("ui", "increment", 1)`:
   - The reducer runs and updates the store state.
   - Subscriptions fire.
   - `useAtomicProp` sees the updated state and re-renders with the new value.

The test asserts that:

- Initial value is rendered correctly.
- After emitting an increment event, the displayed value is updated accordingly.

---

## Rationale

Without this suite, a subtle break in:

- Reducer dispatch path
- Event/emit layer
- Subscription/update pipeline
- Atomic selector reactivity

could ship unnoticed, even if unit suites pass using the mock store.

This integration test validates the *real* usage path for library consumers.

---

## Future Extensions

Potential future integration tests might cover:

- Multi-reducer stores and cross-slice selectors.
- Suspense hooks with real reducers and async `load` functions.
- Integration inside framework-specific environments (Next.js App Router, Remix, etc.).
- SSR/RSC-specific behaviors.

---

## Why This Matters

This suite ensures Quo.js remains ergonomic and correct for its primary use case:

> Stateful React applications backed by a real Quo.js store.

Everything else (devtools, Suspense, analytics integrations) builds on this path.