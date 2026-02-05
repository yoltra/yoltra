[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / StoreProvider

# Variable: StoreProvider

> `const` **StoreProvider**: `React.FC`\<\{ `children`: `ReactNode`; `store`: `StoreInstance`\<`any`, `any`, `any`\>; \}\>

Defined in: [context/StoreProvider.tsx:46](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/react/src/context/StoreProvider.tsx#L46)

React provider that places a StoreInstance into [StoreContext](StoreContext.md).

## Param

The Quo.js store instance to expose to descendant components.

## Param

React subtree that will consume the store.

## Remarks

- Wrap your app (or a subtree) to make the store available via `useContext(StoreContext)`
  or any higher-level hooks you expose (e.g., `useAtomicProp`, `useEmit`).
- You may nest multiple `StoreProvider`s to scope different stores to different subtrees.
- In Next.js App Router, this component must be used in a **client** boundary.

## Example

```tsx
'use client';
import { StoreProvider } from '@quojs/react';
import { createStore } from '@quojs/core';

const store = createStore({
  name: 'App',
  reducer: {
    counter: {
      state: { value: 0 },
      events: [['ui','increment']],
      reducer(s, evt) { return evt.type === 'increment' ? { value: s.value + evt.payload } : s; }
    }
  }
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <StoreProvider store={store}>{children}</StoreProvider>;
}
```
