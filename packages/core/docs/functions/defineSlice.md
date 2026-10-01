![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / defineSlice

# Function: defineSlice()

> **defineSlice**\<`EMAdd`\>(): \<`St`\>(`spec`) => [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`St`, `EMAdd`\> & [`EventMapCarrier`](../interfaces/EventMapCarrier.md)\<`EMAdd`\>

Defined in: [types.ts:2363](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2363)

Declares a reducer spec together with the event map it contributes.

## Type Parameters

### EMAdd

`EMAdd` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md)

## Returns

> \<`St`\>(`spec`): [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`St`, `EMAdd`\> & [`EventMapCarrier`](../interfaces/EventMapCarrier.md)\<`EMAdd`\>

### Type Parameters

#### St

`St`

### Parameters

#### spec

[`ReducerSpec`](../interfaces/ReducerSpec.md)\<`St`, `EMAdd`\>

### Returns

[`ReducerSpec`](../interfaces/ReducerSpec.md)\<`St`, `EMAdd`\> & [`EventMapCarrier`](../interfaces/EventMapCarrier.md)\<`EMAdd`\>

## Remarks

Curried so `EMAdd` is named once and `St` is inferred from `state`, which is what lets every
registration site stay free of type arguments. Identity at runtime.

## Example

```ts
type LibEM = { "lib.transfer": { granted: { id: string } } };

const transfers = defineSlice<LibEM>()({
  state: { granted: [] as string[] },
  when: { keys: [["lib.transfer", "granted"]] },
  reducer: (s, e) => (e.type === "granted" ? { granted: [...s.granted, e.payload.id] } : s),
});

const widened = store.withSlice("transfers", transfers);
// widened.getState().transfers.granted is string[], and `lib.transfer` is emittable
```
