# Typography

Text with a role: `Heading`, `Text`, `Link`, `InlineCode` and `Kbd`.

```ts
import { Heading, Text, Link, InlineCode, Kbd } from "@yoltra/ds";
import "@yoltra/ds/styles/typography.css";
```

## Examples

```tsx
<Heading level={1}>Yoltra</Heading>
<Heading level={2} size="md">A smaller h2</Heading>

<Text>Body copy.</Text>
<Text size="sm" tone="muted">A quieter aside.</Text>
<Text tone="danger" weight="medium">That did not work.</Text>
<Text as="span">Inline, still styled.</Text>

<Link href="/docs">Read the docs</Link>
<Link href="https://example.com" external>Example</Link>

Press <Kbd>Esc</Kbd> to close, or run <InlineCode>rush build</InlineCode>.
```

## Props

`Heading`: `level` (`1`–`6`), `size`, plus `h1`–`h6` attributes.

`Text`: `size` (`"xs" | "sm" | "md" | "lg"`), `tone`
(`"default" | "secondary" | "muted" | "brand" | "danger"`), `weight`
(`"regular" | "medium" | "bold"`), `as`.

`Link`: `external`, plus anchor attributes.

## Notes

`level` sets the element and `size` sets the appearance, separately and on purpose.
A section's second heading is an `h2` whether or not it should look like one, and
conflating the two is how document outlines get broken by visual decisions.

`external` adds `rel="noopener noreferrer"` and `target="_blank"`. It does not add an
icon.

`tone="brand"` reads `--yl-color-fg-brand` rather than the brand colour itself, which
is a step lighter and fails the AA text threshold. `Link` reads the link role, which
now has a hover colour it previously defined and never applied.
