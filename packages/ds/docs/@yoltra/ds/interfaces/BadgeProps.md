![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / BadgeProps

# Interface: BadgeProps

Defined in: [primitives/Badge/Badge.tsx:6](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Badge/Badge.tsx#L6)

## Extends

- `HTMLAttributes`\<`HTMLSpanElement`\>

## Properties

### children

> **children**: `ReactNode`

Defined in: [primitives/Badge/Badge.tsx:16](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Badge/Badge.tsx#L16)

#### Overrides

`HTMLAttributes.children`

***

### variant?

> `optional` **variant**: [`BadgeVariant`](../type-aliases/BadgeVariant.md)

Defined in: [primitives/Badge/Badge.tsx:15](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Badge/Badge.tsx#L15)

What the badge is saying.

#### Remarks

The four status kinds are the same words `Callout` uses, on purpose: a design system with two
vocabularies for one idea makes the reader learn both. Two consuming projects added these
locally before they existed here.
