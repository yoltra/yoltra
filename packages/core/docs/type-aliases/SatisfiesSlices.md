![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / SatisfiesSlices

# Type Alias: SatisfiesSlices\<T, K\>

> **SatisfiesSlices**\<`T`, `K`\> = [`Prettify`](Prettify.md)\<`T` & `Record`\<`K`, `unknown`\>\>

Defined in: [types.ts:2106](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2106)

Proves to the compiler that a widened state record still covers every slice name.

## Type Parameters

### T

`T`

### K

`K` *extends* `string`

## Remarks

`StoreInstance` constrains `S extends Record<R, any>`, and TypeScript cannot correlate
[WidenState](WidenState.md) with [WidenNames](WidenNames.md) well enough to see that the widened record
always carries the widened key set - both branch on `string extends N`, but it checks each
in isolation.

The intersection is with `unknown`, **never `any`**. `T & unknown` reduces to `T`, so every
slice keeps its exact type; `T & any` is `any`, which silently collapses every slice's
state and destroys the inference this feature exists to provide. That was a real bug caught
by the spike, and it is the reason this helper is written out rather than inlined.
