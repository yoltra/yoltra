# Portal

Renders its children into a node under `document.body` instead of where it is written.

```ts
import { Portal } from "@yoltra/ds/client";
```

No stylesheet: it contributes structure, not appearance.

## Examples

```tsx
<Portal>
  <div className="my-overlay">Above everything.</div>
</Portal>
```

Somewhere else, for an application that owns its own overlay root:

```tsx
<Portal container={document.getElementById("overlays")}>
  {panel}
</Portal>
```

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `children` | `ReactNode` | required |
| `container` | `HTMLElement \| null` | a new node under `document.body` |

## Notes

The host node carries `data-yl-portal`, a marker rather than a class: it has no
styling, and it is what a test or a developer in the inspector uses to tell a portal
root from application markup.

It renders nothing on the first pass, because the host is created in an effect. Code
that measures the portalled content has to wait a frame.

`Dialog`, `Drawer`, `Popover`, `Menu`, `ContextMenu` and `Tooltip` all use this. Reach
for it directly only when building something they do not cover, and remember that it
gives you placement and nothing else: no focus trap, no scroll lock, no Escape
handling. An overlay without those is the accessibility bug a consuming project
shipped by hand-rolling one.
