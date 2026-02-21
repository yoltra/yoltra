[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / useSelector

# Function: useSelector()

> **useSelector**\<`S`, `T`\>(`selector`, `isEqual`): `T`

Defined in: [react/src/hooks/hooks.ts:135](https://github.com/yoltra/yoltra/blob/a987f4d35946c58f44d8b45d3fefadd911124683/packages/react/src/hooks/hooks.ts#L135)

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
