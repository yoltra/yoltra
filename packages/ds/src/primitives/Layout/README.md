# Layout

Composition without CSS: `Stack`, `Inline`, `Grid`, `Container` and `Divider`.

```ts
import { Stack, Inline, Grid, Container, Divider } from "@yoltra/ds";
import "@yoltra/ds/styles/layout.css";
```

## Examples

```tsx
<Stack gap={4}>
  <Heading level={2}>Totals</Heading>
  <Text>Everything below is derived.</Text>
</Stack>

<Inline gap={2} align="center" justify="between">
  <Text weight="medium">Parts</Text>
  <Badge>12</Badge>
</Inline>

<Grid minItemWidth="20rem" gap={3}>
  <Card>One</Card>
  <Card>Two</Card>
</Grid>

<Container>
  <Divider />
</Container>
```

Any of them can be another element, which is how a form keeps its layout without a
wrapper:

```tsx
<Stack as="form" gap={3} onSubmit={submit}>
  <Input />
  <Button type="submit">Save</Button>
</Stack>
```

## Props

`Stack` and `Inline`: `gap` (a `SpaceToken`), `align`, `justify`, `as`. `Inline` adds
`wrap`.

`Grid`: `gap`, `columns`, `minItemWidth`, `as`.

`Container`: `as`. `Divider`: `orientation`.

## Notes

`gap` is a step on the spacing scale, not a length, so a layout cannot invent a
value that is off the grid. Defaults are 12px for `Stack` and `Grid` and 8px for
`Inline`.

The gap is applied as `--yl-stack-gap` and friends, so an application can override
one instance without a new class.

`Container` steps its measure at each breakpoint from `--yl-container-md` through
`--yl-container-xl`. Those are tokens because three consuming projects each invented
their own page width, and three products disagreeing about how wide a page is looks
like three products.
