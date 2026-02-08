[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useStore

# Function: useStore()

> **useStore**\<`EM`, `R`, `S`\>(): `StoreInstance`\<`R`, `S`, `EM`\>

Defined in: [react/src/hooks/hooks.ts:80](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/hooks.ts#L80)

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
