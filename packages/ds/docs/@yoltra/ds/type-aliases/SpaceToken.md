[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / SpaceToken

# Type Alias: SpaceToken

> **SpaceToken** = keyof [`FoundationTokens`](../interfaces/FoundationTokens.md)\[`"spacing"`\]

Defined in: [primitives/Layout.tsx:15](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Layout.tsx#L15)

A step on the spacing scale.

## Remarks

Derived from [FoundationTokens](../interfaces/FoundationTokens.md) rather than restated, so a step added to the scale is
immediately spendable here and a step removed stops type-checking at the call sites that
used it.
