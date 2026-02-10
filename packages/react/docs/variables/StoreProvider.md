[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / StoreProvider

# Variable: StoreProvider

> `const` **StoreProvider**: `React.FC`\<\{ `children`: `ReactNode`; `store`: `StoreInstance`\<`any`, `any`, `any`\>; \}\>

Defined in: [react/src/context/StoreProvider.tsx:56](https://github.com/quojs/quojs/blob/7a847d68175722f00e52941458a1511185cf0a4e/packages/react/src/context/StoreProvider.tsx#L56)

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
// store.ts
import { createStore, eventKeys } from '@quojs/core';
import { createContext } from 'react';
import { createQuoHooks, StoreProvider } from '@quojs/react';

type AppEM = { ui: { increment: number } };
type AppState = { counter: { value: number } };

export const store = createStore<AppState, AppEM>({
  name: 'App',
  reducer: {
    counter: {
      state: { value: 0 },
      when: { keys: eventKeys<AppEM>()([['ui', 'increment']]) },
      reducer: (s, evt) => evt.type === 'increment'
        ? { value: s.value + evt.payload }
        : s,
    },
  },
});

const AppStoreContext = createContext<typeof store | null>(null);
export const { useAtomicProp, useEmit } = createQuoHooks(AppStoreContext);

// App.tsx
export function App({ children }: { children: React.ReactNode }) {
  return <StoreProvider store={store}>{children}</StoreProvider>;
}
```
