[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / StoreProvider

# Variable: StoreProvider

> `const` **StoreProvider**: `React.FC`\<\{ `children`: `ReactNode`; `store`: `StoreInstance`\<`any`, `any`, `any`\>; \}\>

Defined in: [react/src/context/StoreProvider.tsx:56](https://github.com/yoltra/yoltra/blob/a987f4d35946c58f44d8b45d3fefadd911124683/packages/react/src/context/StoreProvider.tsx#L56)

React provider that places a StoreInstance into [StoreContext](StoreContext.md).

## Param

The yoltra store instance to expose to descendant components.

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
import { createStore, eventKeys } from '@yoltra/core';
import { createContext } from 'react';
import { createHooks, StoreProvider } from '@yoltra/react';

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
export const { useAtomicProp, useEmit } = createHooks(AppStoreContext);

// App.tsx
export function App({ children }: { children: React.ReactNode }) {
  return <StoreProvider store={store}>{children}</StoreProvider>;
}
```
