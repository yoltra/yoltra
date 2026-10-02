![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Decorated

# Type Alias: Decorated\<R, S, EM, D\>

> **Decorated**\<`R`, `S`, `EM`, `D`\> = `D` *extends* [`Decoration`](../interfaces/Decoration.md)\<infer AddS, infer AddEM\> ? [`StoreInstance`](../interfaces/StoreInstance.md)\<[`WidenNames`](WidenNames.md)\<`R`, keyof `AddS` & `string`\>, [`SatisfiesSlices`](SatisfiesSlices.md)\<[`Prettify`](Prettify.md)\<`S` & `AddS`\>, [`WidenNames`](WidenNames.md)\<`R`, keyof `AddS` & `string`\>\>, [`Merge`](Merge.md)\<`EM`, `AddEM`\>\> : `never`

Defined in: [types.ts:2462](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2462)

The store type that results from applying a [Decoration](../interfaces/Decoration.md).

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

### D

`D`
