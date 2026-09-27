![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / NumericCellProps

# Interface: NumericCellProps

Defined in: [primitives/Table/Table.tsx:12](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Table/Table.tsx#L12)

A cell holding figures rather than prose.

## Remarks

Exported because `TH` and `TD` both accept it, so it is part of their signature whether it has a
name in the reference or not.

## Properties

### numeric?

> `optional` **numeric**: `boolean`

Defined in: [primitives/Table/Table.tsx:21](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Table/Table.tsx#L21)

Right-align and use tabular figures.

#### Remarks

Tabular figures give every digit the same width, so a column of numbers does not shuffle
sideways as it updates. Written out by hand six times across three consuming projects before
it existed here.
