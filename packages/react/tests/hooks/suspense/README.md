# `useSuspenseAtomicProp` & `useSuspenseAtomicProps` Test Suite

## Overview

This suite validates Quo.js's Suspense-enabled selectors and related cache utilities:

- `useSuspenseAtomicProp`
- `useSuspenseAtomicProps`
- `invalidateAtomicProp`
- `invalidateAtomicPropsByReducer`
- `clearSuspenseCache`
- `suspenseCache`

Suspense selectors are a differentiating feature of Quo.js and enable async derived state with granular invalidation semantics tied to reducer paths.

---

## Why Suspense Selectors Exist

Suspense selectors allow components to derive asynchronous values from store state without manually wiring:

- local loading flags
- effect lifecycles
- stale vs. fresh value management

They expose a simple contract:

```ts
load(valueAtPath, slice) => Promise<T> | T
```

The hooks then handle:

- cache keying (per path + optional extra key)
- invalidation on state changes
- subscription wiring via `store.connect`
- Suspense integration via `useSyncExternalStore`

---

## Key Behaviors Validated

### Cache Utilities

- `invalidateAtomicProp(reducer, property, extraKey?)`  
  ✓ Deletes a single cache entry for a specific path.

- `invalidateAtomicPropsByReducer(reducer)`  
  ✓ Deletes all cache entries whose key starts with the reducer prefix.

- `clearSuspenseCache()`  
  ✓ Clears the entire in-memory Suspense cache.

These behaviors are crucial when:
- Mutations are performed outside the usual selector path
- Developers need manual cache control (e.g., after mutations or refetches)

---

### `useSuspenseAtomicProp`

Key behaviors:

- Suspends on first access while `load` resolves.
- After resolution, renders the loaded value.
- When the connected reducer/property path changes, invalidates the cache key and calls `load` again with the new value at that path.

Tests:

- Confirm `load` is called initially with the expected `valAtPath` (e.g., `"first"`).
- Confirm that after mutating the underlying state and triggering `notifyPath`, `load` is called again with the updated `valAtPath` (e.g., `"second"`).
- Focus on call counts and arguments instead of fragile DOM assertions that depend on jsdom’s Suspense timing.

This keeps the tests robust while still validating the contract.

---

### `useSuspenseAtomicProps`

Key behaviors:

- Accepts multiple `{ reducer, property }` specs.
- Normalizes dotted paths and arrays of paths.
- Produces a single async derived value based on the full state, via `load(state)`.
- Re-runs `load` whenever any connected property changes and invalidates the cache.

The primary use cases are:

- Complex derived values that depend on multiple slices (e.g., todos + filter).
- Dashboards that aggregate multiple entity trees.

Tests check that:

- Initial load is performed once.
- After state changes on a dependent path, `load` is called again with the updated state.

---

## Testing Approach

Direct DOM assertions for Suspense behavior in jsdom can be brittle. Instead, this suite:

- Verifies `load` call counts and arguments.
- Verifies cache map mutations through the public invalidation helpers.
- Uses `waitFor`/async flows where needed, without over-specifying rendering transitions.

This approach validates semantics without locking the implementation to a particular React rendering nuance.

---

## What Is Out of Scope

- Full SSR / RSC integration (Next.js App Router, streaming, etc.)
- React 19 advanced Suspense / transitions behavior
- Cache eviction policies beyond simple time-based/explicit invalidation

These belong to higher-level integration or E2E test suites.

---

## Why This Suite Matters

Suspense selectors are a big part of why Quo.js can feel “reactive” and modern without users hand-rolling async glue code.

This suite ensures:

- state changes → proper cache invalidation
- reload semantics are correct
- cache utilities behave predictably

Breaking this would silently corrupt async UI behavior across the app.