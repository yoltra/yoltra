![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / withEffect

# Function: withEffect()

> **withEffect**\<`R`, `S`, `EM`, `Spec`\>(`yoltra`, `spec`): [`DecoratableYoltra`](../type-aliases/DecoratableYoltra.md)\<`R`, `S`, `Merge`\<`EM`, `EMAddOf`\<`Spec`\>\>\>

Defined in: [react/src/createYoltra.tsx:295](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L295)

[YoltraDecoration.withEffect](../interfaces/YoltraDecoration.md#witheffect) as a free function.

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

### EM

`EM` *extends* `EventMapBase`

### Spec

`Spec` *extends* `EffectSpec`\<`any`, `any`\>

## Parameters

### yoltra

[`Yoltra`](../interfaces/Yoltra.md)\<`R`, `S`, `EM`\>

### spec

`Spec`

## Returns

[`DecoratableYoltra`](../type-aliases/DecoratableYoltra.md)\<`R`, `S`, `Merge`\<`EM`, `EMAddOf`\<`Spec`\>\>\>
