# Public API Surface Test Suite

## Purpose

This suite ensures `@yoltra/react` re-exports its public runtime API from `src/index.ts`.

This protects users relying on:

```ts
import { useAtomicProp } from "@yoltra/react";
```

rather than importing from deep paths.

---

## Scenarios Tested

### ✓ Runtime value exports exist

Validates names that have runtime presence:

- `StoreProvider`
- `StoreContext`
- `useStore`
- `useEmit`
- `useSelector`
- `useAtomicProp`
- `useAtomicProps`
- `shallowEqual`
- `useEvent`
- `useSuspenseAtomicProp`
- `useSuspenseAtomicProps`
- `invalidateAtomicProp`
- `invalidateAtomicPropsByReducer`
- `clearSuspenseCache`
- `suspenseCache`
- `createQuoHooks`

Type-only exports are intentionally **not** asserted, as they do not exist at runtime.

### ✗ Type exports intentionally excluded

Exports such as:

- `PathValue`
- `OneOrMany`
- `SuspenseAtomicPropOptions`
- `SuspenseAtomicPropsOptions`
- `UseAtomicProp`
- `UseAtomicProps`

are erased by TypeScript at emit time and cannot be checked via runtime property introspection.

---

## Why This Matters

Surface tests catch regression classes such as:

- Missing exports during refactors
- Incorrect barrel merges
- Inconsistent ESM/CJS output maps
- Packaging tree-shaking errors
- Dead modules after build system changes

This test reduces ecosystem churn for users over time and makes the public API contract explicit.