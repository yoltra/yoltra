[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / GridProps

# Interface: GridProps

Defined in: [primitives/Layout.tsx:173](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Layout.tsx#L173)

## Extends

- `HTMLAttributes`\<`HTMLElement`\>

## Properties

### as?

> `optional` **as**: `ElementType`

Defined in: [primitives/Layout.tsx:179](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Layout.tsx#L179)

***

### children?

> `optional` **children**: `ReactNode`

Defined in: [primitives/Layout.tsx:180](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Layout.tsx#L180)

#### Overrides

`HTMLAttributes.children`

***

### columns?

> `optional` **columns**: `number`

Defined in: [primitives/Layout.tsx:176](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Layout.tsx#L176)

Fixed column count. Ignored when `minItemWidth` is given.

***

### gap?

> `optional` **gap**: `number`

Defined in: [primitives/Layout.tsx:174](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Layout.tsx#L174)

***

### minItemWidth?

> `optional` **minItemWidth**: `string`

Defined in: [primitives/Layout.tsx:178](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Layout.tsx#L178)

Narrowest a column may be before the grid drops one, e.g. `"24rem"`.
