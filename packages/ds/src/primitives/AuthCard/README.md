# AuthCard

A centred card for a sign-in, sign-up or recovery screen.

```ts
import { AuthCard } from "@yoltra/ds";
import "@yoltra/ds/styles/authcard.css";
import "@yoltra/ds/styles/card.css";
import "@yoltra/ds/styles/layout.css";
import "@yoltra/ds/styles/typography.css";
```

It composes `Card`, `Stack` and `Heading`, so it needs their stylesheets as well as its own.

## Examples

```tsx
<AuthCard title="Sign in">
  <Stack as="form" gap={3} onSubmit={submit}>
    <FormField id="email" label="Email">
      {(control) => <Input {...control} type="email" autoComplete="email" />}
    </FormField>
    <FormField id="password" label="Password">
      {(control) => <Input {...control} type="password" autoComplete="current-password" />}
    </FormField>
    <Button type="submit" loading={busy}>Sign in</Button>
  </Stack>
</AuthCard>
```

When the card is not the whole page:

```tsx
<AuthCard as="div" title="Sign in to continue">{form}</AuthCard>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `ReactNode` | required | Rendered as the page's `h1`. |
| `as` | `ElementType` | `"main"` | |
| `children` | `ReactNode` | required | |

## Notes

It is pure composition, which is exactly why it belongs here. A consuming project used it six times
across two applications and then reproduced the same four nested elements inline a seventh time,
because the component lived in one app's folder and the other could not import it. That is a
distribution problem rather than a design one.

`as="main"` by default, because a sign-in screen usually is the page. Pass `as="div"` when it is
not: a document with two `main` landmarks has told a screen reader nothing about which is the
content.

The card is centred on the cross axis always and on the main axis only when there is room, so a
tall form scrolls from the top rather than having its heading pushed off screen.
