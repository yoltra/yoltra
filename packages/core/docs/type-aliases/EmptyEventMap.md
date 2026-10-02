![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EmptyEventMap

# Type Alias: EmptyEventMap

> **EmptyEventMap** = `Record`\<`never`, `never`\>

Defined in: [types.ts:2524](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2524)

The event map a spec contributes when it declares none.

## Remarks

`Record<never, never>` rather than `{}`: the bare empty-object type accepts any non-nullish
value, including `0` and `""`, so it would let nonsense through [Merge](Merge.md). This has no
keys, which is the actual claim being made, and [Merge](Merge.md) short-circuits on it.
