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
<Button variant="danger" onClick={remove}>Delete</Button>
<Button size="sm">Filter</Button>
<Button size="lg">Sell</Button>
<Button disabled>Save</Button>
```

Work in flight, without the button changing width or losing its name:

```tsx
<Button loading={saving} onClick={save}>Save</Button>
```

A toggle says so:

```tsx
<Button pressed={bold} onClick={() => setBold(!bold)}>Bold</Button>
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

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `"primary" \| "ghost" \| "danger"` | `"primary"` | |
| `size` | `"md" \| "sm" \| "lg"` | `"md"` | `md` is 36px, `lg` is 44px. |
| `loading` | `boolean` | | Sets `aria-busy`, swallows clicks. |
| `pressed` | `boolean` | | Becomes `aria-pressed`. Toggles only. |

`IconButton` adds a required `label`. `ButtonGroup` takes `label` and `children`.

## Notes

`label` on `IconButton` renders into a `VisuallyHidden`, so the control has an
accessible name without showing text. An icon button whose only name is a tooltip
loses that name the moment the tooltip closes.

The primary fill is `--yl-color-interactive-bg`, which is `primary[600]` rather than
`primary[500]`. White on `[500]` is 4.06:1, so every primary button label failed AA
until this changed.

`md` is 36px tall, which is comfortable with a pointer. `lg` is 44px, the size a finger needs.

`loading` sets `aria-busy` and `aria-disabled`, not `disabled`: the real attribute would drop the
control out of the tab order mid-action and throw the reader somewhere else. The label stays in the
layout at zero opacity, which holds the width **and** keeps the accessible name, where
`visibility: hidden` or `display: none` would hold the width and take the name away. The spinner is
drawn in `button.css` rather than borrowed from `Spinner`, so one stylesheet stays enough.

`pressed` is for toggles only. On a button that performs an action, `aria-pressed="false"` reports a
state that does not exist.

`danger` uses `error[600]`, where a white label is 4.83:1. At `[500]` it would have been 3.76:1,
which is the same step-too-light mistake the brand colour made.
