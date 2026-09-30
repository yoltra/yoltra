# Popover

The anchored tier: `Popover`, `Menu`, `MenuItem`, `MenuSeparator` and `ContextMenu`.

```ts
import { Popover, Menu, MenuItem, MenuSeparator, ContextMenu } from "@yoltra/ds/client";
import "@yoltra/ds/styles/popover.css";
```

## Examples

The trigger is a render prop, so the component can give it the ref it needs to
measure against and the ARIA attributes that tie the two together:

```tsx
<Popover
  open={open}
  onClose={close}
  label="Details"
  trigger={(props) => <Button {...props}>Details</Button>}
>
  <Text>Anything.</Text>
</Popover>
```

A menu is the same shape, with focus roving over the items:

```tsx
<Menu open={open} onClose={close} label="Actions" trigger={(props) => (
  <IconButton {...props} label="Actions">…</IconButton>
)}>
  <MenuItem onSelect={rename}>Rename</MenuItem>
  <MenuSeparator />
  <MenuItem onSelect={remove} disabled>Delete</MenuItem>
</Menu>
```

A context menu opens at a point rather than against an element:

```tsx
const [at, setAt] = useState<Point | null>(null);

<div onContextMenu={(e) => { e.preventDefault(); setAt({ x: e.clientX, y: e.clientY }); }}>
  <ContextMenu at={at} onClose={() => setAt(null)} label="Row actions">
    <MenuItem onSelect={open}>Open</MenuItem>
  </ContextMenu>
</div>
```

## Props

Shared: `open`, `onClose`, `label`, `children`, `placement`, `offset`, `container`,
`className`. `Popover` and `Menu` take `trigger`; `ContextMenu` takes `at` instead of
`open`.

## Notes

`label` is required because an anchored surface has no visible heading to borrow a
name from.

Focus moves to the first item when a menu opens and roves with ArrowUp, ArrowDown,
Home and End, wrapping at both ends. There is no typeahead.

Placement flips and clamps near the window edges. A point is treated as a zero-sized
rectangle, so a context menu near an edge behaves exactly as an element-anchored menu
does. The arithmetic lives in `placement.ts` and is tested against synthetic
rectangles rather than a real layout.

`--yl-z-popover` sits above `--yl-z-overlay`, so a popover opened inside a dialog is
above it. The order of those tokens encodes containment and is not arbitrary.
