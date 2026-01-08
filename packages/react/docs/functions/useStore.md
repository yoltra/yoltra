[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useStore

# Function: useStore()

> **useStore**\<`EM`, `R`, `S`\>(): `StoreInstance`\<`R`, `S`, `EM`\>

Defined in: [hooks/hooks.ts:100](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/react/src/hooks/hooks.ts#L100)

Returns the current StoreInstance from [StoreContext](../variables/StoreContext.md).
Throws if used outside of a `<StoreProvider>`.

## Type Parameters

### EM

`EM` *extends* `EventMapBase`

Event map type.

### R

`R` *extends* `string`

Reducer name union.

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

## Returns

`StoreInstance`\<`R`, `S`, `EM`\>

## Example

```tsx
const store = useStore<MyEM, 'counter' | 'todos', AppState>();
const state = store.getState();
```
