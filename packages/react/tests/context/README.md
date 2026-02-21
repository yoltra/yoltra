# StoreProvider & StoreContext Test Suite

## Purpose

This suite validates the fundamental React context integration for `@yoltra/react`. The goal is not to test business logic, but to ensure that yoltra store instances can be passed to descendant components and consumed via hooks.

## Rationale

The `StoreProvider` and `StoreContext` layer is intentionally minimal, but if it regresses, the entire React surface area collapses. This suite tests:

---

## Scenarios Tested

### ✓ Context value propagation

Ensures a `StoreInstance` placed in `<StoreProvider store={...}>` is visible to `useStore()` and other downstream hooks. This prevents silent failures in complex component trees.

### ✓ Error on missing provider

`useStore()` must throw when no `StoreProvider` is above the calling component. This prevents subtle runtime bugs where the store becomes "undefined" and behaviors degrade silently.

This behavior is intentionally strict and documented — users must explicitly scope the store.

---

## Scope Avoidance (Non-Goals)

- Does not test store methods (`emit`, `subscribe`, etc.) — these are verified in more focused suite(s).
- Does not test multi-store nesting (not critical at this layer).

---

## Why This Matters

Every other hook depends on correct context wiring. A regression here would crash:

- `useEmit` (fails with undefined emit)
- `useSelector` (fails to subscribe)
- Atomic selectors (fail to connect)
- Suspense selectors (fail to build cache keys)

Having a tight minimal test on this avoids multiplying failures upstream.