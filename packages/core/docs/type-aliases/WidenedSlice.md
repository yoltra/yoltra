![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / WidenedSlice

# Type Alias: WidenedSlice\<R, S, EM, N, Spec\>

> **WidenedSlice**\<`R`, `S`, `EM`, `N`, `Spec`\> = [`DecoratableStore`](DecoratableStore.md)\<[`WidenNames`](WidenNames.md)\<`R`, `N`\>, [`SatisfiesSlices`](SatisfiesSlices.md)\<[`WidenState`](WidenState.md)\<`S`, `N`, [`StateOfSpec`](StateOfSpec.md)\<`Spec`\>\>, [`WidenNames`](WidenNames.md)\<`R`, `N`\>\>, [`Merge`](Merge.md)\<`EM`, [`EMAddOf`](EMAddOf.md)\<`Spec`\>\>\>

Defined in: [types.ts:2058](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2058)

The store type after mounting slice `N` from `Spec`.

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

### N

`N` *extends* `string`

### Spec

`Spec`
