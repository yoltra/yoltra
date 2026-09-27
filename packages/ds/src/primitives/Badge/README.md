# Badge

A short, non-interactive label: a status, a count, a tag.

```ts
import { Badge } from "@yoltra/ds";
import "@yoltra/ds/styles/badge.css";
```

## Examples

```tsx
<Badge>Draft</Badge>
<Badge variant="brand">New</Badge>
```

It forwards every `span` attribute, so a badge that names something for assistive
technology can say so:

```tsx
<Badge aria-label="3 unread notifications">3</Badge>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `"neutral" \| "brand"` | `"neutral"` | |
| `children` | `ReactNode` | required | |

## Notes

A badge is a `span`, not a button. If it needs a click handler it is the wrong
component; use `Button` with `size="sm"`.

`variant="brand"` reads `--yl-color-fg-brand`, which is a step darker than the brand
colour itself. The brand blue is 4.06:1 on the badge's own background, below the AA
text threshold, and this is the pairing two consuming projects reported
independently before it was fixed.
