![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / CardProps

# Interface: CardProps

Defined in: [primitives/Card.tsx:8](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Card.tsx#L8)

## Extends

- `HTMLAttributes`\<`HTMLElement`\>

## Properties

### as?

> `optional` **as**: `ElementType`

Defined in: [primitives/Card.tsx:23](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Card.tsx#L23)

Element to render.

#### Remarks

A card that is itself a link or a button should say so — `as="a"` or `as="article"` —
rather than nesting an interactive element that covers the whole surface, which is how a
card ends up unreachable by keyboard.

***

### bordered?

> `optional` **bordered**: `boolean`

Defined in: [primitives/Card.tsx:14](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Card.tsx#L14)

Draw a border. On by default; turn it off when the card sits on a tinted surface.

***

### children?

> `optional` **children**: `ReactNode`

Defined in: [primitives/Card.tsx:24](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Card.tsx#L24)

#### Overrides

`HTMLAttributes.children`

***

### elevation?

> `optional` **elevation**: [`CardElevation`](../type-aliases/CardElevation.md)

Defined in: [primitives/Card.tsx:12](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Card.tsx#L12)

Shadow depth, from the elevation tokens. Defaults to `xs`.

***

### padding?

> `optional` **padding**: `number`

Defined in: [primitives/Card.tsx:10](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Card.tsx#L10)

Inner spacing, as a step on the spacing scale. Defaults to `5` (20px).
