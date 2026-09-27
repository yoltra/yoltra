![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / WidenState

# Type Alias: WidenState\<S, N, St\>

> **WidenState**\<`S`, `N`, `St`\> = `string` *extends* `N` ? `S` : [`Prettify`](Prettify.md)\<`S` & `Record`\<`N`, `St`\>\>

Defined in: [types.ts:1936](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1936)

The state record after adding slice `N` with state `St`. Degrades to `S` when `N` is not a
string literal, for the reason given on [WidenNames](WidenNames.md).

## Type Parameters

### S

`S`

### N

`N` *extends* `string`

### St

`St`
