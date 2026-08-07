![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / useStore

# Function: useStore()

> **useStore**\<`EM`, `R`, `S`\>(): `StoreInstance`\<`R`, `S`, `EM`\>

Defined in: [react/src/hooks/hooks.ts:63](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/hooks.ts#L63)

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
