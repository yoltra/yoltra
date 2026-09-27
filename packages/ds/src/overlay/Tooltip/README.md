# Tooltip

A short description that appears on hover or focus.

```ts
import { Tooltip } from "@yoltra/ds/client";
import "@yoltra/ds/styles/tooltip.css";
```

## Examples

```tsx
<Tooltip content="Deploy the solar array">
  {(props) => <IconButton {...props} label="Deploy">↑</IconButton>}
</Tooltip>
```

The pointer delay can be tuned or removed:

```tsx
<Tooltip content="Copied" delayMs={0}>
  {(props) => <Button {...props}>Copy</Button>}
</Tooltip>
```

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `content` | `ReactNode` | required |
| `children` | `(props) => ReactNode` | required |
| `placement` | `Placement` | `"top"` |
| `offset` | `number` | `8` |
| `delayMs` | `number` | `400` |

## Notes

This is the one overlay here that is not controlled. Its visibility belongs to the
pointer and the focus ring, not to application state.

It is wired with `aria-describedby`, never `aria-label`. Labelling a control with a
tooltip leaves an icon button whose name disappears when the tooltip does, which is
why `IconButton` takes its own `label`.

Focus opens it immediately and skips `delayMs`. Arriving by keyboard is deliberate in
a way that passing over with a mouse is not.

The surface never takes focus and never receives pointer events, because catching the
pointer would let it flicker itself out of existence by triggering the leave handler
on the element underneath.

The trigger props include `tabIndex: 0`. A `<button>` is focusable already and it changes nothing
there; a `<span>` or an `<svg>` is not, and without it that tooltip would open for a pointer and
never for a keyboard. A consuming project added it at three separate call sites before noticing it
was the same omission each time.
