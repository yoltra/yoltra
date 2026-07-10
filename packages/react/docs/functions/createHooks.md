[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / createHooks

# Function: createHooks()

> **createHooks**\<`R`, `S`, `EM`\>(`StoreContext`): [`YoltraHooks`](../interfaces/YoltraHooks.md)\<`R`, `S`, `EM`\>

Defined in: [react/src/hooks/createHooks.ts:240](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/react/src/hooks/createHooks.ts#L240)

Factory that creates fully-typed React hooks bound to a specific store context.

This is the **recommended** setup pattern for yoltra + React. It eliminates
the need for explicit type parameters on every hook call — all types are
inferred from the store context once, at creation time.

## Type Parameters

### R

`R` *extends* `string`

Reducer name union.

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

### EM

`EM` *extends* `EventMapBase`

Event map.

## Parameters

### StoreContext

`Context`\<`StoreInstance`\<`R`, `S`, `EM`\>\>

A React context carrying a `StoreInstance<R, S, EM>`.

## Returns

[`YoltraHooks`](../interfaces/YoltraHooks.md)\<`R`, `S`, `EM`\>

An object with typed hooks: `useStore`, `useEmit`, `useSelector`,
  `useAtomicProp`, `useAtomicProps`, `useEvent`, and `shallowEqual`.

## Throws

If any returned hook is called outside a `<StoreProvider>`.

## Example

```tsx
// 1. Define your event map and state
type AppEM = { ui: { increment: number; decrement: number } };
type AppState = { counter: { value: number } };

// 2. Create a typed context
import { createContext } from 'react';
import { StoreInstance } from '@yoltra/core';
const AppStoreContext = createContext<
  StoreInstance<'counter', AppState, AppEM> | null
>(null);

// 3. Create typed hooks (do this once, export from a shared module)
const { useAtomicProp, useEmit, useEvent } = createHooks(AppStoreContext);

// 4. Use in components — no explicit generics needed
function Counter() {
  const value = useAtomicProp({ reducer: 'counter', property: 'value' });
  const emit = useEmit();
  return (
    <button onClick={() => emit('ui', 'increment', 1)}>
      Count: {value}
    </button>
  );
}
```
