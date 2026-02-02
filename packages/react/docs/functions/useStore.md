[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useStore

# Function: useStore()

> **useStore**\<`EM`, `R`, `S`\>(): `StoreInstance`\<`R`, `S`, `EM`\>

Defined in: [hooks/hooks.ts:102](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/react/src/hooks/hooks.ts#L102)

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
