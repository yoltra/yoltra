# Table

Thin wrappers over the native table elements: `Table`, `THead`, `TBody`, `TR`, `TH`,
`TD`.

```ts
import { Table, THead, TBody, TR, TH, TD } from "@yoltra/ds";
import "@yoltra/ds/styles/table.css";
```

## Examples

```tsx
<Table>
  <caption className="yl-visually-hidden">Published packages</caption>
  <THead>
    <TR>
      <TH scope="col">Package</TH>
      <TH scope="col">Version</TH>
    </TR>
  </THead>
  <TBody>
    <TR>
      <TD>core</TD>
      <TD>0.8.0</TD>
    </TR>
  </TBody>
</Table>
```

## Props

Each takes the native attributes of the element it renders, which is the point:
`scope` on a `TH`, `colSpan` on a `TD`, and so on.

## Notes

These are presentational and deliberately stay that way. Sorting, pagination and
selection are a different component's job, and building them in here would make the
simple case pay for the complex one.

`scope` on a header cell is not optional in practice. Without it a screen reader has
to guess which cells a header governs.

There is no responsive overflow container and no numeric alignment. A consuming
project added both locally, which is a fair signal that they belong here.
