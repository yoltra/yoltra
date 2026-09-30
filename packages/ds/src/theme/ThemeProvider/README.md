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

`ThemeProvider` takes `children` and an optional `defaultTheme` (`"light"` unless
given), which it renders with until the stored or system preference is read on mount.
`useTheme()` returns `{ theme, setTheme }` and throws outside a provider.
`applyTheme(id)` sets the attribute directly.

From the default entry, `noFlashScript()` returns the inline script described below, and
`THEME_STORAGE_KEY` is the `localStorage` key it shares with the provider.

## Notes

Theming is `data-theme="light" | "dark"` on the document root, and every colour
resolves through a custom property. That is what lets the primitives render on the
server: only the toggle needs to be a client component.

On mount the provider reads `localStorage["yoltra-theme"]`, then falls back to
`prefers-color-scheme`. That happens in an effect, after the browser has painted, so
without help a reader who chose dark sees a white flash first. `noFlashScript()` sets the
attribute before the body renders. Inline it in the document head, before any stylesheet:

```tsx
import { noFlashScript } from "@yoltra/ds";

// app/layout.tsx
<head>
  <script dangerouslySetInnerHTML={{ __html: noFlashScript() }} />
</head>
```

Storage is allowed to fail. When site data is blocked, when there is no `localStorage`,
or when the stored value is not a theme, the provider falls back to the system
preference, and `setTheme` still switches the theme even if it cannot remember it.

The storage key is fixed. Two applications on one origin share it.
