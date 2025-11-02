[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / createQuoHooks

# Function: createQuoHooks()

> **createQuoHooks**\<`R`, `S`, `AM`\>(`StoreContext`): `object`

Defined in: [hooks/createQuoHooks.ts:146](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/createQuoHooks.ts#L146)

Factory that binds **typed React hooks** to a specific StoreInstance via context.

Call this **once per app** (or per store instance type) and export the returned hooks.

## Type Parameters

### R

`R` *extends* `string`

Slice name union (string literal union).

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
- `useSliceProp(spec, map?, isEqual?)` – subscribe to a **single** dotted path (or glob).
- `useSliceProps(specs, selector, isEqual?)` – subscribe to **many** paths/globs and compute a derived value.
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

### useDispatch()

> **useDispatch**: () => `Dispatch`\<`AM`\>

Returns the store’s `dispatch` function (stable reference).

#### Returns

`Dispatch`\<`AM`\>

#### Example

```tsx
const dispatch = useDispatch();
dispatch('ui','toggle',true);
```

### useSelector()

> **useSelector**: \<`T`\>(`selector`, `isEqual`) => `T`

Selects a derived value from the store using an external-store subscription.

#### Type Parameters

##### T

`T`

#### Parameters

##### selector

(`state`) => `T`

`(state) => value` derived from the current immutable state.

##### isEqual

(`a`, `b`) => `boolean`

Optional equality check (defaults to `Object.is`) to suppress re-renders.

#### Returns

`T`

The selected value, memoized by `isEqual`.

#### Example

```tsx
const total = useSelector(s => s.todos.items.length);
```

### useSliceProp

> **useSliceProp**: [`UseSliceProp`](../type-aliases/UseSliceProp.md)\<`R`, `S`\>

Subscribe to a **single** path/glob within a slice and return the selected value.
See overload signatures above.

### useSliceProps

> **useSliceProps**: [`UseSliceProps`](../type-aliases/UseSliceProps.md)\<`R`, `S`\>

Subscribe to **many** paths/globs and return a memoized derived value.
See overload signatures above.

### useStore()

> **useStore**: () => `StoreInstance`\<`R`, `S`, `AM`\>

Returns the current StoreInstance from context.
Throws if used outside of a [StoreProvider](../variables/StoreProvider.md).

#### Returns

`StoreInstance`\<`R`, `S`, `AM`\>

#### Example

```tsx
const store = useStore();
const state = store.getState();
```

## Example

```tsx
// hooks.ts
import { StoreContext } from '../context/StoreContext';
export const { useStore, useDispatch, useSelector, useSliceProp, useSliceProps } =
  createQuoHooks<'counter' | 'todos', AppState, AM>(StoreContext);

// component.tsx
function Counter() {
  const value = useSliceProp({ reducer: 'counter', property: 'value' });
  const dispatch = useDispatch();
  return <button onClick={() => dispatch('ui','increment',1)}>{value}</button>;
}
```
