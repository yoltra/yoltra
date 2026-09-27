# Button

The interactive family: `Button`, `ButtonLink`, `IconButton` and `ButtonGroup`.

```ts
import { Button, ButtonLink, IconButton, ButtonGroup } from "@yoltra/ds";
import "@yoltra/ds/styles/button.css";
```

## Examples

```tsx
<Button onClick={save}>Save</Button>
<Button variant="ghost">Cancel</Button>
<Button size="sm">Filter</Button>
<Button disabled>Save</Button>
```

A link that looks like a button is still a link, so it navigates and it can be
opened in a new tab:

```tsx
<ButtonLink href="/docs">Read the docs</ButtonLink>
```

An icon-only control needs a name, so `label` is required rather than optional:

```tsx
<IconButton label="Close">×</IconButton>
```

A set that reads as one control takes a group label:

```tsx
<ButtonGroup label="Text style">
  <Button variant="ghost">Bold</Button>
  <Button variant="ghost">Italic</Button>
</ButtonGroup>
```

## Props

`Button` and `ButtonLink` take every native `button` / `a` attribute, plus:

| Prop | Type | Default |
| --- | --- | --- |
| `variant` | `"primary" \| "ghost"` | `"primary"` |
| `size` | `"md" \| "sm"` | `"md"` |

`IconButton` adds a required `label`. `ButtonGroup` takes `label` and `children`.

## Notes

`label` on `IconButton` renders into a `VisuallyHidden`, so the control has an
accessible name without showing text. An icon button whose only name is a tooltip
loses that name the moment the tooltip closes.

The primary fill is `--yl-color-interactive-bg`, which is `primary[600]` rather than
`primary[500]`. White on `[500]` is 4.06:1, so every primary button label failed AA
until this changed.

`md` is 36px tall. A touch target wants 44px, and a size for that is planned rather
than present.
