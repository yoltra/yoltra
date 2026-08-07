[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / IconButtonProps

# Interface: IconButtonProps

Defined in: [primitives/Button.tsx:73](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button.tsx#L73)

## Extends

- `ButtonHTMLAttributes`\<`HTMLButtonElement`\>

## Properties

### children

> **children**: `ReactNode`

Defined in: [primitives/Button.tsx:86](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button.tsx#L86)

The glyph. Hidden from assistive technology, since `label` carries the meaning.

#### Overrides

`ButtonHTMLAttributes.children`

***

### label

> **label**: `string`

Defined in: [primitives/Button.tsx:82](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button.tsx#L82)

What the button does, in words.

#### Remarks

Required, and rendered visually hidden. An icon button with no accessible name is
announced as "button" and nothing else, which is among the most common failures in any
interface — so this component does not offer the option of omitting it.

***

### size?

> `optional` **size**: [`ButtonSize`](../type-aliases/ButtonSize.md)

Defined in: [primitives/Button.tsx:84](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button.tsx#L84)

***

### variant?

> `optional` **variant**: [`ButtonVariant`](../type-aliases/ButtonVariant.md)

Defined in: [primitives/Button.tsx:83](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Button.tsx#L83)
