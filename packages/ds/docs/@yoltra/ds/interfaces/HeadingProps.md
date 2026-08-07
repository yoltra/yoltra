[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / HeadingProps

# Interface: HeadingProps

Defined in: [primitives/Typography.tsx:8](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Typography.tsx#L8)

## Extends

- `HTMLAttributes`\<`HTMLHeadingElement`\>

## Properties

### children?

> `optional` **children**: `ReactNode`

Defined in: [primitives/Typography.tsx:21](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Typography.tsx#L21)

#### Overrides

`HTMLAttributes.children`

***

### level?

> `optional` **level**: `4` \| `6` \| `1` \| `2` \| `3` \| `5`

Defined in: [primitives/Typography.tsx:10](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Typography.tsx#L10)

Outline level, 1–6. Rendered as the matching `h` element.

***

### size?

> `optional` **size**: [`TextSize`](../type-aliases/TextSize.md)

Defined in: [primitives/Typography.tsx:20](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Typography.tsx#L20)

Visual size, when it should differ from the level.

#### Remarks

The escape hatch that keeps the outline honest. A section that is structurally an `h3` but
should look small stays an `h3` and takes `size="sm"`, rather than being demoted to an
`h5` for appearance and leaving a hole in the document outline that screen-reader users
navigate by.
