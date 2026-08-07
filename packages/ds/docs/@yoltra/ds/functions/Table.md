[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Table

# Function: Table()

> **Table**(`__namedParameters`): `Element`

Defined in: [primitives/Table.tsx:25](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Table.tsx#L25)

A data table.

## Parameters

### \_\_namedParameters

`HTMLAttributes`\<`HTMLTableElement`\> & `object`

## Returns

`Element`

## Remarks

A real `<table>`, with the pieces exported separately so the markup stays semantic — a grid
of `<div>`s is announced as a wall of unrelated text, and a screen-reader user navigating by
column has nothing to navigate. Give it a `<caption>` when the surrounding heading does not
already say what the table holds.

## Example

```tsx
<Table>
  <THead><TR><TH scope="col">Peer</TH><TH scope="col">State</TH></TR></THead>
  <TBody>
    {peers.map((p) => <TR key={p.id}><TD>{p.id}</TD><TD>{p.state}</TD></TR>)}
  </TBody>
</Table>
```
