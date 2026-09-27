# Card

A surface that groups related content.

```ts
import { Card } from "@yoltra/ds";
import "@yoltra/ds/styles/card.css";
```

## Examples

```tsx
<Card>Body</Card>
<Card bordered={false} elevation="none">Flat</Card>
<Card elevation="md">Lifted</Card>
<Card padding={6}>Roomier than the default</Card>
```

A card is bordered with a hairline shadow by default, so `<Card>` on its own already
looks like a card.

It renders a `div` unless told otherwise, so a card that is really a section can say
so:

```tsx
<Card as="section" aria-labelledby="totals">
  <Heading id="totals" level={2}>Totals</Heading>
</Card>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `padding` | `SpaceToken` | `4` (16px) | A step on the spacing scale, not a length. |
| `elevation` | `"none" \| "xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"xs"` | |
| `bordered` | `boolean` | `true` | Pass `bordered={false}` for a flat surface. |
| `tone` | `"default" \| "subtle"` | `"default"` | `subtle` tints the surface. |
| `as` | `ElementType` | `"div"` | |

## Notes

`padding` and `elevation` are applied as the component-local custom properties
`--yl-card-padding` and `--yl-card-shadow`, so an application can override one
instance from its own stylesheet without reaching into the component's classes.

`tone="subtle"` tints the surface, for a card holding something secondary to what surrounds it.
It exists because a consuming project added the same thing locally and two of its screens gave up
on `Card` entirely and inlined a border instead.