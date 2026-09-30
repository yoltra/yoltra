# Callout

A block of prose set apart from what surrounds it, carrying a status.

```ts
import { Callout } from "@yoltra/ds";
import "@yoltra/ds/styles/callout.css";
```

## Examples

```tsx
<Callout>Snapshots are written on the first run and committed.</Callout>
<Callout kind="success">Published to npm.</Callout>
<Callout kind="warning">This rewrites history.</Callout>
<Callout kind="error">The host could not be reached.</Callout>
```

## Props

| Prop | Type | Default |
| --- | --- | --- |
| `kind` | `"info" \| "success" \| "warning" \| "error"` | `"info"` |
| `children` | `ReactNode` | required |

## Notes

The icon is decorative and hidden from assistive technology. The kind is carried by
the colour *and* by whatever the prose says, because a status told only in colour is
not told at all to a reader who cannot see it. If the distinction matters, say it in
the text.

For a message a reader must be told about as it arrives, a live region is the right
tool and this is not one. `FormField`'s `error` slot is, and it sets `role="alert"`.
