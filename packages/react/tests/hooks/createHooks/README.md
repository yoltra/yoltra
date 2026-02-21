# `createHooks` Test Suite

## Overview

This suite validates the behavior of the `createHooks` factory, which generates a scoped set of
React hooks tied to a provided `StoreContext`.

The primary purpose is to ensure yoltra can support **multi-context**, **multi-store**, and
**library-embedded** use cases without relying on a global store or singleton bindings.

---

## Why `createHooks` Exists

yoltra intentionally avoids singletons because they introduce:

- Global mutable state
- Tight coupling between UI and store lifecycle
- Incompatibility with nested micro-frontend architectures
- Testing friction
- Problems with Next.js App Router + RSC boundary scoping

`createHooks` solves this by letting libraries define their own typed hooks:

```ts
const {
  useStore,
  useEmit,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  useEvent,
  shallowEqual,
} = createHooks(MyCustomContext);
```

This makes yoltra composable and improves DX for large apps.

---

## Key Behaviors Validated

### ✓ Hooks bind to a custom `StoreContext`

Ensures the user can scope multiple independent stores, e.g.:

- Domain stores (search, cart, notifications, editor)
- Internal dashboards
- Embedded widgets
- Multi-tenant UI shells

### ✓ Core hook surface mirrors default exports

Factory must produce a hook set identical in semantics to the default runtime surface:

- `useStore`
- `useEmit`
- `useSelector`
- `useAtomicProp`
- `useAtomicProps`
- `useEvent`
- `shallowEqual`

The test ensures consistency and avoids API divergence over time.

### ✓ Store identity and emit identity preserved

The test explicitly asserts:

- `useStore()` returns the provided store instance
- `useEmit()` returns the store’s `emit` function by reference

This matters for:

- Referential stability
- React devtools
- Effects + async dispatch
- Middleware chaining

---

## What the Test Does _Not_ Cover

These concerns are intentionally excluded:

- Type inference (TS-level only)
- Suspense selectors (separate suite)
- Atomic multi-selector semantics (covered elsewhere)
- Transition / RSC compatibility (future Next.js integration suite)

---

## Why This Suite Matters

`createHooks` is one of the most advanced APIs in yoltra and enables:

- Multiple isolated providers within the same React tree
- Plugin systems (e.g., CMS, dashboards, analytics)
- Testing harnesses with disposable stores
- Incremental migration of large codebases

If it regresses, users lose a major scaling feature and are forced into anti-patterns.
