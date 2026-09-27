![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / TableScrollProps

# Interface: TableScrollProps

Defined in: [primitives/Table/Table.tsx:24](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Table/Table.tsx#L24)

## Properties

### children

> **children**: `ReactNode`

Defined in: [primitives/Table/Table.tsx:33](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Table/Table.tsx#L33)

***

### className?

> `optional` **className**: `string`

Defined in: [primitives/Table/Table.tsx:34](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Table/Table.tsx#L34)

***

### label

> **label**: `string`

Defined in: [primitives/Table/Table.tsx:32](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Table/Table.tsx#L32)

Names the scrollable region.

#### Remarks

Required, and not decoration. A scrollable box is focusable so it can be scrolled from the
keyboard, and a focusable region with no name is a stop that announces nothing.
