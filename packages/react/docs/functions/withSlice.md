![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / withSlice

# Function: withSlice()

> **withSlice**\<`R`, `S`, `EM`, `N`, `Spec`\>(`yoltra`, `name`, `spec`, `options?`): [`DecoratableYoltra`](../type-aliases/DecoratableYoltra.md)\<`WidenNames`\<`R`, `N`\>, \{ \[K in string \| number \| symbol\]: (WidenState\<S, N, StateOfSpec\<Spec\>\> & Record\<WidenNames\<R, N\>, unknown\>)\[K\] \}, `Merge`\<`EM`, `EMAddOf`\<`Spec`\>\>\>

Defined in: [react/src/createYoltra.tsx:254](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L254)

[YoltraDecoration.withSlice](../interfaces/YoltraDecoration.md#withslice) as a free function.

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

### EM

`EM` *extends* `EventMapBase`

### N

`N` *extends* `string`

### Spec

`Spec` *extends* `ReducerSpec`\<`any`, `any`\>

## Parameters

### yoltra

[`Yoltra`](../interfaces/Yoltra.md)\<`R`, `S`, `EM`\>

### name

`N`

### spec

`Spec`

### options?

#### owner?

`string`

## Returns

[`DecoratableYoltra`](../type-aliases/DecoratableYoltra.md)\<`WidenNames`\<`R`, `N`\>, \{ \[K in string \| number \| symbol\]: (WidenState\<S, N, StateOfSpec\<Spec\>\> & Record\<WidenNames\<R, N\>, unknown\>)\[K\] \}, `Merge`\<`EM`, `EMAddOf`\<`Spec`\>\>\>

## Remarks

For a library handed a `Yoltra` it did not create. Identical to the method.
