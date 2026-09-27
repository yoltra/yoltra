![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / CardTone

# Type Alias: CardTone

> **CardTone** = `"default"` \| `"subtle"`

Defined in: [primitives/Card/Card.tsx:16](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Card/Card.tsx#L16)

A card's surface.

## Remarks

`subtle` is a tinted panel, for a card that groups something secondary. A consuming project
added `.zync-card--subtle` locally and two of its screens gave up on `Card` and inlined a
border instead, which is a clear enough signal.
