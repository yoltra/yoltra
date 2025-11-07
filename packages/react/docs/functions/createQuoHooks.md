[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / createQuoHooks

# Function: createQuoHooks()

> **createQuoHooks**\<`R`, `S`, `AM`\>(`StoreContext`): `object`

Defined in: [hooks/createQuoHooks.ts:142](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/createQuoHooks.ts#L142)

Factory that binds **typed React hooks** to a specific StoreInstance via context.

Call this **once per app** (or per store instance type) and export the returned hooks.

## Type Parameters

### R

`R` *extends* `string`

Reducer name union (string literal union).

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

### AM

`AM` *extends* `ActionMapBase`

Action map for `(channel → event → payload)`.

## Parameters

### StoreContext

`Context`\<`null` \| `StoreInstance`\<`R`, `S`, `AM`\>\>

A React context that carries `StoreInstance<R,S,AM> | null`.

## Returns

An object with pre-bound hooks:
- `useStore()` – access the store from context (throws if missing).
- `useDispatch()` – stable dispatch reference.
- `useSelector(selector, isEqual?)` – external-store selector with memoized equality.
- `useAtomicProp(spec, map?, isEqual?)` – subscribe to a **single** dotted path (or glob).
- `useAtomicProps(specs, selector, isEqual?)` – subscribe to **many** paths/globs and compute a derived value.
- `useSliceProp` / `useSliceProps` – **deprecated wrappers** that warn in dev.
- `shallowEqual` – helper equality for objects.

### shallowEqual()

> **shallowEqual**: \<`T`\>(`a`, `b`) => `boolean`

Shallow equality for plain records using `Object.is` per-key.

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
shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 }) // true
shallowEqual({ a: 1 }, { a: 1, b: 2 })       // false (different keys)
```

### useAtomicProp

> **useAtomicProp**: [`UseAtomicProp`](../type-aliases/UseAtomicProp.md)\<`R`, `S`\>

Subscribe to a **single** path/glob.

### useAtomicProps

> **useAtomicProps**: [`UseAtomicProps`](../type-aliases/UseAtomicProps.md)\<`R`, `S`\>

Subscribe to **many** paths/globs.

### useDispatch()

> **useDispatch**: () => `Dispatch`\<`AM`\>

#### Returns

`Dispatch`\<`AM`\>

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

### ~~useSliceProp~~

> **useSliceProp**: [`UseAtomicProp`](../type-aliases/UseAtomicProp.md)\<`R`, `S`\>

#### Deprecated

Use [useAtomicProp](useAtomicProp.md) instead.

### ~~useSliceProps~~

> **useSliceProps**: [`UseAtomicProps`](../type-aliases/UseAtomicProps.md)\<`R`, `S`\>

#### Deprecated

Use [useAtomicProps](useAtomicProps.md) instead.

### useStore()

> **useStore**: () => `StoreInstance`\<`R`, `S`, `AM`\>

#### Returns

`StoreInstance`\<`R`, `S`, `AM`\>

## Example

```tsx
// hooks.ts
import { StoreContext } from '../context/StoreContext';
export const {
  useStore, useDispatch, useSelector,
  useAtomicProp, useAtomicProps,
} = createQuoHooks<'counter' | 'todos', AppState, AM>(StoreContext);
```
