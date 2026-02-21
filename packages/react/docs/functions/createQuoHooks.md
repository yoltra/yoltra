[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / createQuoHooks

# Function: createQuoHooks()

> **createQuoHooks**\<`R`, `S`, `EM`\>(`StoreContext`): `object`

Defined in: [react/src/hooks/createQuoHooks.ts:223](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/react/src/hooks/createQuoHooks.ts#L223)

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

An object with typed hooks: `useStore`, `useEmit`, `useSelector`,
  `useAtomicProp`, `useAtomicProps`, `useEvent`, and `shallowEqual`.

### shallowEqual()

> **shallowEqual**: \<`T`\>(`a`, `b`) => `boolean`

Shallow object equality using `Object.is` per-key.

Useful as the `isEqual` argument for `useAtomicProp` and `useAtomicProps`
when the derived value is a plain object. Also available as a standalone
export from `@yoltra/react` via [hooks.shallowEqual](#createquohooks).

#### Type Parameters

##### T

`T` *extends* `Record`\<`string`, `unknown`\>

#### Parameters

##### a

`T`

##### b

`T`

#### Returns

`boolean`

#### Example

```ts
shallowEqual({ a: 1 }, { a: 1 }); // true
shallowEqual({ a: 1 }, { a: 2 }); // false
```

### useAtomicProp

> **useAtomicProp**: [`UseAtomicProp`](../type-aliases/UseAtomicProp.md)\<`R`, `S`\>

### useAtomicProps

> **useAtomicProps**: [`UseAtomicProps`](../type-aliases/UseAtomicProps.md)\<`R`, `S`\>

### useEmit()

> **useEmit**: () => `Emit`\<`EM`\>

#### Returns

`Emit`\<`EM`\>

### useEvent

> **useEvent**: [`UseEvent`](../type-aliases/UseEvent.md)\<`EM`, `S`\>

### useSelector()

> **useSelector**: \<`T`\>(`selector`, `isEqual`) => `T`

#### Type Parameters

##### T

`T`

#### Parameters

##### selector

(`state`) => `T`

##### isEqual

(`a`, `b`) => `boolean`

#### Returns

`T`

### useStore()

> **useStore**: () => `StoreInstance`\<`R`, `S`, `EM`\>

#### Returns

`StoreInstance`\<`R`, `S`, `EM`\>

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
const { useAtomicProp, useEmit, useEvent } = createQuoHooks(AppStoreContext);

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
