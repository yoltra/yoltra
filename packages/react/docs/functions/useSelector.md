[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSelector

# Function: useSelector()

> **useSelector**\<`S`, `T`\>(`selector`, `isEqual`): `T`

Defined in: [hooks/hooks.ts:172](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/react/src/hooks/hooks.ts#L172)

Selects a derived value from the store using an external-store subscription.
Re-renders when the selected value changes per `isEqual`.

## Type Parameters

### S

`S` *extends* `Record`\<`any`, `any`\>

State type returned by `getState()`.

### T

`T`

Selected value type.

## Parameters

### selector

(`state`) => `T`

`(state) => value` derived from the current state.

### isEqual

(`a`, `b`) => `boolean`

Optional equality comparator (defaults to `Object.is`).

## Returns

`T`

## Example

```tsx
const total = useSelector((s: AppState) => s.todos.items.length);
```
