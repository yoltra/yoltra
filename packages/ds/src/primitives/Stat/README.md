# Stat

A single figure with its label, and a grid to put several in.

```ts
import { Stat, StatGrid } from "@yoltra/ds";
import "@yoltra/ds/styles/stat.css";
```

## Examples

```tsx
<StatGrid>
  <Stat label="Open downloads" value={12} />
  <Stat label="Disk used" value="4.2 GB" hint="of 20 GB" />
  <Stat label="Failed" value={0} size="sm" />
</StatGrid>
```

One on its own is fine too:

```tsx
<Stat label="Uptime" value="99.98%" hint="last 30 days" />
```

## Props

`Stat`: `label` and `value` (both required), `hint`, `size` (`"md" | "sm"`), plus every `div`
attribute.

`StatGrid`: `children`, plus every `div` attribute.

## Notes

**Pass a real zero.** Rendering a dash for nought tells a reader the figure is *unavailable* when
it is simply none, and those are different facts. A consuming project wrote that rule down after
getting it wrong.

`value` is a `ReactNode` and is deliberately not formatted here. A count, a byte size and a
currency amount want different formatting, and a design system that picked one would be wrong for
the other two.

The label comes before the value in the DOM as well as on screen, so a screen reader reads "open
downloads, twelve" rather than a number with no subject.

Figures are tabular, so a row of stats does not shuffle sideways as the numbers update. That is
most of what makes a live dashboard feel unstable.

`StatGrid` fills by available width rather than by a column count, so the same markup works in a
sidebar and across a dashboard. Use `Grid` when the number of columns is the thing that matters.
