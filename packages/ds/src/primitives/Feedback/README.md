# Feedback

Three ways of saying "there is nothing here yet, or not yet": `Spinner`, `Skeleton`
and `EmptyState`.

```ts
import { Spinner, Skeleton, EmptyState } from "@yoltra/ds";
import "@yoltra/ds/styles/feedback.css";
```

## Examples

A spinner needs a name, because a reader who cannot see it still needs to know
something is happening:

```tsx
<Spinner label="Loading results" />
<Spinner size="sm" label="Searching" />
```

A skeleton stands in for content whose shape is known:

```tsx
<Skeleton width="20rem" height="2rem" />
<Skeleton circle width="4rem" height="4rem" />
```

An empty state is worth more when it says what to do next:

```tsx
<EmptyState
  title="No stores yet"
  description="Connect an application to see its events here."
  action={<Button onClick={connect}>Connect</Button>}
/>
```

## Props

`Spinner`: `size` (`"sm" | "md" | "lg"`), `label`.

`Skeleton`: `width`, `height`, `circle`.

`EmptyState`: `title` (required), `description`, `icon`, `action`, `headingLevel`
(`2`–`6`, default `3`).

## Notes

Both animations stop under `prefers-reduced-motion`.

`headingLevel` exists because an empty state inside a section should not restart the
document outline. Pick the level that follows the heading above it.

A spinner is the wrong tool for something long-running. A consuming project noted
that "the status is the progress indicator: a spinner would hide a stuck job, the
word *running* beside a task id does not."
