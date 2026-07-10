# @yoltra/ds

The **Yoltra Design System** — foundation tokens, semantic light/dark themes, a
CSS-variable stylesheet generator, and primitive React components shared across
the [Yoltra](https://yoltra.dev) website, documentation, and examples.

## Install

```bash
npm install @yoltra/ds
```

## Usage

Inject the stylesheet once at your app root, then use the primitives anywhere:

```tsx
import { themeCss, Button, Callout, CodeBlock } from "@yoltra/ds";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
      </head>
      <body className="yl-root">{children}</body>
    </html>
  );
}
```

Theming is driven by a **`data-theme="light" | "dark"`** attribute on the
document root. Because the DS resolves colors through CSS custom properties,
primitives render on the server — only interactive controls (theme toggle,
tabs, copy button) are client components.

## What's inside

| Export | Purpose |
| --- | --- |
| `foundationTokens` | Primitive scale: color palette, type, spacing, radius, elevation, motion. |
| `lightTheme` / `darkTheme` / `themes` | Semantic role mappings (background/foreground/border/interactive/status). |
| `themeCss()` | Emits the full stylesheet (`--yl-*` vars + component base styles). |
| `ThemeProvider` / `useTheme` / `applyTheme` | Generic theme controller (reflects onto `data-theme`). |
| `Button`, `ButtonLink`, `Badge`, `CodeBlock`, `Callout`, `Tabs`, `Table` | Primitive components. |

> Consumers that own their state (like the Yoltra website, which drives the
> theme through a Yoltra store) can skip `ThemeProvider` and set `data-theme`
> themselves — the DOM contract is the same.

## Brand

Primary blue `#1A7FE2`, ink `#0F172A`. Type: **Inter** + **JetBrains Mono**.

## License

MIT © Manu Ramirez
