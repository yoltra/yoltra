![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / TableScroll

# Function: TableScroll()

> **TableScroll**(`__namedParameters`): `Element`

Defined in: [primitives/Table/Table.tsx:57](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Table/Table.tsx#L57)

A horizontal scroll container for a table too wide for its column.

## Parameters

### \_\_namedParameters

[`TableScrollProps`](../interfaces/TableScrollProps.md)

## Returns

`Element`

## Remarks

Separate from [Table](Table.md) rather than built into it, because wrapping every table in a scroll
region would change the layout of every table that did not need one, and because the label has
to come from the caller.

A consuming project carried a wrapper of its own at eight call sites, injected through a
runtime `<style>` tag, which is a clear enough signal that it belongs here.

## Example

```tsx
<TableScroll label="Published packages">
  <Table>{rows}</Table>
</TableScroll>
```
