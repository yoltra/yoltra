[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useStore

# Function: useStore()

> **useStore**\<`AM`, `R`, `S`\>(): `StoreInstance`\<`R`, `S`, `AM`\>

Defined in: [hooks/hooks.ts:100](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/hooks.ts#L100)

Returns the current StoreInstance from [StoreContext](../variables/StoreContext.md).
Throws if used outside of a `<StoreProvider>`.

## Type Parameters

### AM

`AM` *extends* `ActionMapBase`

Action map type.

### R

`R` *extends* `string`

Reducer name union.

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
