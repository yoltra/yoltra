![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / CardProps

# Interface: CardProps

Defined in: [primitives/Card/Card.tsx:20](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Card/Card.tsx#L20)

## Extends

- `HTMLAttributes`\<`HTMLElement`\>

## Properties

### as?

> `optional` **as**: `ElementType`

Defined in: [primitives/Card/Card.tsx:37](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Card/Card.tsx#L37)

Element to render.

#### Remarks

A card that is itself a link or a button should say so — `as="a"` or `as="article"` —
rather than nesting an interactive element that covers the whole surface, which is how a
card ends up unreachable by keyboard.

***

### bordered?

> `optional` **bordered**: `boolean`

Defined in: [primitives/Card/Card.tsx:26](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Card/Card.tsx#L26)

Draw a border. On by default; turn it off when the card sits on a tinted surface.

***

### children?

> `optional` **children**: `ReactNode`

Defined in: [primitives/Card/Card.tsx:38](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Card/Card.tsx#L38)

#### Overrides

`HTMLAttributes.children`

***

### elevation?

> `optional` **elevation**: [`CardElevation`](../type-aliases/CardElevation.md)

Defined in: [primitives/Card/Card.tsx:24](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Card/Card.tsx#L24)

Shadow depth, from the elevation tokens. Defaults to `xs`.

***

### padding?

> `optional` **padding**: `number`

Defined in: [primitives/Card/Card.tsx:22](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Card/Card.tsx#L22)

Inner spacing, as a step on the spacing scale. Defaults to `5` (20px).

***

### tone?

> `optional` **tone**: [`CardTone`](../type-aliases/CardTone.md)

Defined in: [primitives/Card/Card.tsx:28](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Card/Card.tsx#L28)

Surface treatment. `subtle` tints it, for content that is secondary to what surrounds it.
