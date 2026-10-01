![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Merge

# Type Alias: Merge\<A, B\>

> **Merge**\<`A`, `B`\> = \[keyof `B`\] *extends* \[`never`\] ? `A` : [`Prettify`](Prettify.md)\<`A` & `B`\>

Defined in: [types.ts:2035](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2035)

Merges `B` into `A`, flattening the result. An empty `B` leaves `A` untouched, so a
decoration that adds no events costs nothing at the type level.

## Type Parameters

### A

`A`

### B

`B`
