![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / useStore

# Function: useStore()

> **useStore**\<`EM`, `R`, `S`\>(): [`StoreInstance`](https://github.com/yoltra/yoltra/blob/main/packages/core/docs/interfaces/StoreInstance.md)\<`R`, `S`, `EM`\>

Defined in: [react/src/hooks/hooks.ts:64](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/hooks.ts#L64)

Returns the current [StoreInstance](https://github.com/yoltra/yoltra/blob/main/packages/core/docs/interfaces/StoreInstance.md) from [StoreContext](../variables/StoreContext.md).
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

[`StoreInstance`](https://github.com/yoltra/yoltra/blob/main/packages/core/docs/interfaces/StoreInstance.md)\<`R`, `S`, `EM`\>

## Example

```tsx
const store = useStore<MyEM, 'counter' | 'todos', AppState>();
const state = store.getState();
```
