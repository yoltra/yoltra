# Chip

A compact tag for a value: a format, a filter, a keyword.

```ts
import { Chip } from "@yoltra/ds";
import "@yoltra/ds/styles/chip.css";
```

## Examples

```tsx
<Inline gap={1}>
  <Chip>gguf</Chip>
  <Chip>safetensors</Chip>
  <Chip variant="brand">q4_k_m</Chip>
</Inline>
```

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `variant` | `"neutral" \| "brand"` | `"neutral"` |
| `children` | `ReactNode` | required |

Plus every `span` attribute.

## Notes

Distinct from `Badge`, and the distinction is worth keeping. A badge is a pill and says something
about **state**; a chip has a small radius and reads as a piece of **data**. A row of pills all
claiming to be statuses is noise. A consuming project drew the same line and used both.

Not interactive. A chip you can remove or select is a button, and this is a `span`.
