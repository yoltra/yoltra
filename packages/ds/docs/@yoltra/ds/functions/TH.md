[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / TH

# Function: TH()

> **TH**(`__namedParameters`): `Element`

Defined in: [primitives/Table.tsx:58](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Table.tsx#L58)

A table header cell. See [Table](Table.md).

## Parameters

### \_\_namedParameters

`ThHTMLAttributes`\<`HTMLTableCellElement`\> & `object`

## Returns

`Element`

## Remarks

Pass `scope="col"` or `scope="row"`: it is what lets assistive technology associate each
data cell with its header, and it cannot be inferred reliably from position. The attribute
reaches the `<th>` untouched, as do `colSpan`, `rowSpan` and the rest.
