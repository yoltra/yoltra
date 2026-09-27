# Modal

The modal tier: `Dialog` and `Drawer`.

```ts
import { Dialog, Drawer } from "@yoltra/ds/client";
import "@yoltra/ds/styles/modal.css";
```

## Examples

Both are controlled. `open` and `onClose` are the whole state contract:

```tsx
const [open, setOpen] = useState(false);

<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Delete this store?"
  description="Its event log goes with it."
  footer={<Button onClick={confirm}>Delete</Button>}
>
  <Text>This cannot be undone.</Text>
</Dialog>
```

```tsx
<Drawer open={open} onClose={close} side="left" title="Filters">
  <Stack gap={3}>{filters}</Stack>
</Drawer>
```

Focus can be aimed at something other than the first focusable child:

```tsx
const input = useRef<HTMLInputElement>(null);

<Dialog open={open} onClose={close} title="Rename" initialFocusRef={input}>
  {(<Input ref={input} />)}
</Dialog>
```

## Props

Shared: `open`, `onClose`, `title`, `description`, `children`, `footer`,
`dismissOnOutsideClick`, `dismissOnEscape`, `showCloseButton`, `closeLabel`,
`initialFocusRef`, `container`, `className`.

`Dialog` adds `size` (`"sm" | "md" | "lg" | "full"`). `Drawer` adds
`side` (`"left" | "right" | "top" | "bottom"`) and a `size` length.

## Notes

These render through `Portal` into a node under `document.body`, which is not a
stylistic choice. Rendering in place loses to CSS three ways: an ancestor with
`overflow: hidden` clips the panel, an ancestor with a `transform` becomes the
containing block so a viewport-centred dialog is centred in that ancestor instead,
and an ancestor that established a stacking context traps the overlay beneath
whatever sits above it. No amount of `z-index` fixes any of the three.

What comes with being open: a focus trap, focus restored to whatever opened it, a
ref-counted scroll lock that survives nesting and releases exactly once, and Escape
closing the topmost overlay only.

`title` is wired with `aria-labelledby` and `description` with
`aria-describedby`. A dialog with neither has no name.
