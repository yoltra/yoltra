![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / AuthCardProps

# Interface: AuthCardProps

Defined in: [primitives/AuthCard/AuthCard.tsx:7](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/AuthCard/AuthCard.tsx#L7)

## Properties

### as?

> `optional` **as**: `ElementType`

Defined in: [primitives/AuthCard/AuthCard.tsx:19](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/AuthCard/AuthCard.tsx#L19)

Element to render.

#### Remarks

`main` by default, because a sign-in screen usually *is* the page. Pass `as="div"` when it is
not: a document with two `main` landmarks has told a screen reader nothing about which is the
content.

***

### children

> **children**: `ReactNode`

Defined in: [primitives/AuthCard/AuthCard.tsx:10](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/AuthCard/AuthCard.tsx#L10)

***

### className?

> `optional` **className**: `string`

Defined in: [primitives/AuthCard/AuthCard.tsx:20](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/AuthCard/AuthCard.tsx#L20)

***

### title

> **title**: `ReactNode`

Defined in: [primitives/AuthCard/AuthCard.tsx:9](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/AuthCard/AuthCard.tsx#L9)

The screen's heading. Rendered as the page's `h1`.
