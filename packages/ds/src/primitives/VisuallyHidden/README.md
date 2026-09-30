# VisuallyHidden

Content for assistive technology and for nobody else.

```ts
import { VisuallyHidden } from "@yoltra/ds";
import "@yoltra/ds/styles/base.css";
```

The styling lives in `base.css`, as `.yl-visually-hidden`, because it is needed
wherever text is and not only where this component is.

## Examples

```tsx
<Button>
  Delete
  <VisuallyHidden> the 3 selected rows</VisuallyHidden>
</Button>

<table>
  <VisuallyHidden as="caption">Published packages</VisuallyHidden>
</table>
```

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `as` | `ElementType` | `"span"` |
| `children` | `ReactNode` | |

## Notes

This is not `display: none` and not `visibility: hidden`, either of which would hide
the content from a screen reader too. It is clipped to a one-pixel box, which keeps
it in the accessibility tree.

It does not become visible on focus. A skip link needs that, and this is not one.

`IconButton` uses it internally for its `label`, so an icon-only control has a name
without showing text.
