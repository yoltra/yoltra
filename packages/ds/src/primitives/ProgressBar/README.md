# ProgressBar

How much of something is done.

```ts
import { ProgressBar } from "@yoltra/ds";
import "@yoltra/ds/styles/progressbar.css";
```

## Examples

```tsx
<ProgressBar label="Downloading model" value={done} max={total} />
```

Give assistive technology something better to read than a number:

```tsx
<ProgressBar
  label="Downloading model"
  value={done}
  max={total}
  valueText={`${done} of ${total} files`}
/>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `number` | required | Clamped to the range. |
| `max` | `number` | `100` | |
| `label` | `string` | required | Names what is progressing. |
| `valueText` | `string` | | Becomes `aria-valuetext`. |

## Notes

Determinate only, and that is the point: it is the counterpart to `Spinner`, which says that
something is happening where this says how much of it is done. A consuming project put the
distinction well while arguing against a spinner for long work, that a spinner would hide a stuck
job where the word "running" beside a task id does not.

`label` is required. A bar with no name is announced as a percentage with no subject, and a reader
who cannot see which section it sits in has no way to find out what it measures.

The value is clamped rather than trusted. A bar rendered past its end is a layout bug that arrives
with production data, long after the component was reviewed.

The fill is a `transform`, not a width, so the browser animates it without laying out again. It
stops animating under `prefers-reduced-motion`.
