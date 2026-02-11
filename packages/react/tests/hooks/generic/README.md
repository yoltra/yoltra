# Base Hooks Test Suite (`useStore`, `useEmit`, `useSelector`, `useAtomicProp`, `useAtomicProps`, `shallowEqual`)

## Purpose

This suite validates the core non-Suspense React hooks that define Quo.js state consumption and event emission behavior.

These tests enforce public observable behavior rather than implementation details, ensuring the library remains refactorable during the v0.5 → v0.6 evolution.

---

## Mocking Strategy

A deterministic in-memory `MockStore` is used instead of a real Quo.js store, because:

- Hooks rely primarily on `subscribe`, `connect`, `emit`, and `getState`.
- Running full reducer/effect logic would make unrelated failures cascade.
- Behavioral tests should isolate external store semantics from React integration semantics.

---

## Scenarios Tested

### `useStore()`
✓ Reads the store instance from context  
✓ Throws if called without a provider

---

### `useEmit()`
✓ Provides `store.emit` with stable reference  
✓ Emits correct channel/event/payload tuples  
✓ Does not subscribe or resubscribe the component

---

### `useSelector()`
✓ Selects derived value and re-renders only when derived output changes  
✓ Supports `isEqual` comparator to prevent unnecessary re-renders  
→ Tests intentionally track render counts to enforce semantic contract

---

### `useAtomicProp()`
✓ Subscribes to fine-grained reducer.property paths  
✓ Handles dotted paths including leading `.` normalization  
✓ Supports mapping and custom equality  
✓ Supports wildcard paths (forces internal `_useAtomicPropImpl` branch)  
✓ Connects via `store.connect` rather than `subscribe` (critical for large apps)

---

### `useAtomicProps()`
✓ Subscribes to multiple paths and recomputes a derived selector  
✓ Validates path normalization logic for property arrays  
✓ Ensures a single derived selector call per version tick  
→ Behavior important for high-frequency or multi-owner UIs

---

### `shallowEqual()`
✓ Behavioral parity check with expected shallow compare rules  
→ Used by users for memo patterns and internal equality checks

---

## Scope Avoidance (Non-Goals)

Notably omitted:

- Does not test nested RSC/SSR interaction
- Does not test Suspense behavior (covered in dedicated suite)
- Does not test EventMap typing inference (Type-level test concern)

---

## Why This Matters

These hooks define the ergonomic surface of Quo.js React bindings. If they regress, all downstream user code breaks:

- React components
- Devtools
- Profiler tools
- Integration with frameworks (Next.js Apps, Remix, Expo, etc.)
