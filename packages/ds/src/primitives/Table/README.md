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

Figures get `numeric` on both the header and the body cell, which right-aligns them and switches
on tabular figures so the column does not shuffle sideways as values change width:

```tsx
<TH scope="col" numeric>Size</TH>
<TD numeric>12.5</TD>
```

A table wider than its column goes in a `TableScroll`, a separate component rather than a prop
because wrapping every table would change the layout of every table that did not need it:

```tsx
<TableScroll label="Published packages">
  <Table>{rows}</Table>
</TableScroll>
```

Its `label` is required: the region is focusable so it can be scrolled from the keyboard, and a
focusable region with no name is a tab stop that announces nothing.
