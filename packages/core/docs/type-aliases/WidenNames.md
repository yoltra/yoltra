![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / WidenNames

# Type Alias: WidenNames\<R, N\>

> **WidenNames**\<`R`, `N`\> = `string` *extends* `N` ? `R` : `R` \| `N`

Defined in: [types.ts:2048](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2048)

The slice-name union after adding `N`.

## Type Parameters

### R

`R` *extends* `string`

### N

`N` *extends* `string`

## Remarks

The `string extends N` guard is load-bearing. Passing a `string`-typed variable rather than
a literal would otherwise widen the union to `string`, and every `S[R1]` lookup downstream
would resolve to the union of every slice's state - silently destroying `useAtomicProp`
inference across the whole application. Degrading to "no widening" is the safe failure.
