![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / withMiddleware

# Function: withMiddleware()

> **withMiddleware**\<`R`, `S`, `EM`, `M`\>(`yoltra`, `mw`): [`DecoratableYoltra`](../type-aliases/DecoratableYoltra.md)\<`R`, `S`, `Merge`\<`EM`, `EMAddOf`\<`M`\>\>\>

Defined in: [react/src/createYoltra.tsx:281](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L281)

[YoltraDecoration.withMiddleware](../interfaces/YoltraDecoration.md#withmiddleware) as a free function.

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

### EM

`EM` *extends* `EventMapBase`

### M

`M` *extends* `MiddlewareInput`\<`any`, `any`\>

## Parameters

### yoltra

[`Yoltra`](../interfaces/Yoltra.md)\<`R`, `S`, `EM`\>

### mw

`M`

## Returns

[`DecoratableYoltra`](../type-aliases/DecoratableYoltra.md)\<`R`, `S`, `Merge`\<`EM`, `EMAddOf`\<`M`\>\>\>
