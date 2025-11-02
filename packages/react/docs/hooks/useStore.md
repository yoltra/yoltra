[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useStore

# Function: useStore()

> **useStore**\<`AM`, `R`, `S`\>(): `StoreInstance`\<`R`, `S`, `AM`\>

Defined in: [hooks/hooks.ts:99](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/hooks.ts#L99)

Returns the current StoreInstance from [StoreContext](../variables/StoreContext.md).
Throws if used outside of a `<StoreProvider>`.

## Type Parameters

### AM

`AM` *extends* `ActionMapBase`

Action map type.

### R

`R` *extends* `string`

Slice name union.

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

## Returns

`StoreInstance`\<`R`, `S`, `AM`\>

## Example

```tsx
const store = useStore<MyAM, 'counter' | 'todos', AppState>();
const state = store.getState();
```
