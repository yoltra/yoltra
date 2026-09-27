# CodeBlock

A block of code on a dark surface, with a copy button.

```ts
import { CodeBlock } from "@yoltra/ds/client";
import "@yoltra/ds/styles/codeblock.css";
```

`/client`, not the main entry: the copy button needs an event handler and the
clipboard, so this is a client component.

## Examples

```tsx
<CodeBlock code="npm install @yoltra/ds" />
<CodeBlock code="npm install @yoltra/ds" language="bash" title="Install" />
```

Already-highlighted markup goes in as children instead of `code`, which lets a
documentation site bring its own highlighter:

```tsx
<CodeBlock language="ts">
  <span className="tok-keyword">const</span> store = createStore(spec);
</CodeBlock>
```

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `code` | `string` | The plain text. Also what the copy button copies. |
| `language` | `string` | Shown in the header, and used as a `data-language`. |
| `title` | `string` | A filename or a label. |
| `children` | `ReactNode` | Pre-highlighted markup, instead of `code`. |

## Notes

The surface is `--yl-color-bg-ink` and does not flip with the theme, because code
reads better on a dark ground in both. Its text reads `--yl-color-fg-on-ink`, which
is the role that exists for content on that surface.

The copy button's colours are still three `rgba()` literals rather than tokens. That
is a known gap, not a decision.
