![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / TH

# Function: TH()

> **TH**(`__namedParameters`): `Element`

Defined in: [primitives/Table/Table.tsx:125](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Table/Table.tsx#L125)

A table header cell. See [Table](Table.md).

## Parameters

### \_\_namedParameters

`ThHTMLAttributes`\<`HTMLTableCellElement`\> & [`NumericCellProps`](../interfaces/NumericCellProps.md) & `object`

## Returns

`Element`

## Remarks

Pass `scope="col"` or `scope="row"`: it is what lets assistive technology associate each
data cell with its header, and it cannot be inferred reliably from position. The attribute
reaches the `<th>` untouched, as do `colSpan`, `rowSpan` and the rest.
