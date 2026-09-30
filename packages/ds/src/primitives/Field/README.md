# Field

The three native controls: `Input`, `Select` and `Textarea`.

```ts
import { Input, Select, Textarea } from "@yoltra/ds";
import "@yoltra/ds/styles/field.css";
```

## Examples

```tsx
<Input placeholder="Hub host" />
<Input size="sm" type="search" aria-label="Filter parts" />
<Input block />

<Select defaultValue="md">
  <option value="sm">Small</option>
  <option value="md">Medium</option>
</Select>

<Textarea rows={4} block />
```

## Props

Every native attribute of the underlying element, plus:

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `"md" \| "sm"` | `"md"` | Shadows the native `size` attribute, which these do not forward. |
| `block` | `boolean` | `false` | Fills its container. |

## Notes

These are unstyled about their label: they take one or they do not. Pair them with
`FormField`, which owns the label, the hint and the error and wires the `id` and
`aria-describedby` for you.

A label written by hand needs `htmlFor`. `<label className="yl-label">` on its own
receives no styling, which is a trap the design system's own documentation used to
set and no longer does.

`:disabled` is exempt from the contrast threshold under WCAG 1.4.3, so disabled text
here is deliberately below it.
