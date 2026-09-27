# ThemeProvider

Holds the light or dark choice and reflects it onto the document.

```ts
import { ThemeProvider, useTheme, applyTheme } from "@yoltra/ds/client";
import "@yoltra/ds/styles/tokens.css";
import "@yoltra/ds/styles/base.css";
```

## Examples

```tsx
<ThemeProvider>
  <App />
</ThemeProvider>
```

```tsx
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button variant="ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? "Light" : "Dark"}
    </Button>
  );
}
```

An application that owns its own state does not need the provider at all, because the
DOM contract is the attribute rather than the context:

```ts
applyTheme("dark"); // sets data-theme on <html>
```

## API

`ThemeProvider` takes `children`. `useTheme()` returns `{ theme, setTheme }` and
throws outside a provider. `applyTheme(id)` sets the attribute directly.

## Notes

Theming is `data-theme="light" | "dark"` on the document root, and every colour
resolves through a custom property. That is what lets the primitives render on the
server: only the toggle needs to be a client component.

On mount the provider reads `localStorage["yoltra-theme"]`, then falls back to
`prefers-color-scheme`. Before that it renders with whatever the document already
says, so an application that cares about a flash of the wrong theme should set the
attribute before first paint with a small inline script. The design system documents
that and does not currently ship it, which a consuming project noticed and worked
around by writing its own.

The storage key is fixed. Two applications on one origin share it.
