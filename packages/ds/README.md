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
| `Portal`, `Dialog`, `Drawer` | Modal overlays, rendered outside the tree. See below. |
| `Popover`, `Menu`, `ContextMenu`, `Tooltip` | Anchored overlays, positioned against a trigger or a point. |

> Consumers that own their state (like the Yoltra website, which drives the
> theme through a Yoltra store) can skip `ThemeProvider` and set `data-theme`
> themselves — the DOM contract is the same.

## Brand

Primary blue `#1A7FE2`, ink `#0F172A`. Type: **Inter** + **JetBrains Mono**.

## Installing styles

The design system ships **one stylesheet per component**, so an application carries styles for
what it imports and nothing else. Two sheets are always needed; the rest are opt-in.

```ts
import "@yoltra/ds/styles/tokens.css";   // the custom properties, both themes
import "@yoltra/ds/styles/base.css";     // the 10px root, .yl-root, .yl-container
import "@yoltra/ds/styles/button.css";   // one per component you use
import "@yoltra/ds/styles/badge.css";
```

`@yoltra/ds/styles/all.css` carries everything, for a documentation site or a prototype where
the trade is not worth making.

This is deliberate. The JavaScript tree-shakes — the size budget proves it — but a single
stylesheet carrying every component's rules cannot, so it becomes a cost every application
pays regardless of what it renders.

`themeCss()` is still exported and emits the same custom properties, for a server render that
needs them inlined rather than linked.

## 1rem is 10px

`base.css` sets `html { font-size: 62.5% }`, which makes the root 10px and every length in the
system read as its pixel value divided by ten — `1.6rem` is 16px, `0.4rem` is 4px. Tokens are
authored in pixels, because `spacing[4]` being `16` is easier to reason about than `1.6`, and
only the emitted value carries the unit.

`rem` rather than `px` so a reader's font-size preference still scales the interface. The
smaller root makes the arithmetic legible; it does not make the sizing fixed.

Three things follow, and they are easy to get wrong:

- **Breakpoints are in pixels.** `rem` inside a media query resolves against the *initial*
  root font size, not this one, so a rem breakpoint would silently be 1.6× what it reads as.
- **Hairline borders are in pixels.** `0.1rem` invites sub-pixel rounding; a 1px border should
  be 1px.
- **The root declaration is global.** It affects the whole document, not only Yoltra
  components. An application that cannot accept that should import
  `@yoltra/ds/styles/base-no-root.css` and set its own root — at which point every `--yl-*`
  length is relative to whatever it chooses.

## Overlays

`Dialog` and `Drawer` render through `Portal` into a node under `document.body`, rather than
where they are written. That is not a stylistic choice — rendering in place loses to CSS three
different ways, and no amount of `z-index` fixes any of them:

- an ancestor with `overflow: hidden` clips the panel;
- an ancestor with `transform`, `filter` or `will-change` becomes the containing block for
  `position: fixed`, so a "viewport-centred" dialog is centred in that ancestor instead;
- an ancestor that established a stacking context traps the overlay beneath whatever sits above
  *that* ancestor.

Portalling to the body leaves the overlay competing only with the document's own stacking
order, which is what the `--yl-z-*` tokens describe. Their order encodes containment: a popover
opened inside a dialog sits above it, and a tooltip above them both.

### The modal tier

`Dialog` and `Drawer` are controlled — `open` and `onClose` are the whole state contract — and
they come with the behaviour that makes an overlay usable rather than merely visible:

| Behaviour | What it prevents |
| --- | --- |
| Focus trapped inside the surface | Tab walking out of a modal into the page behind it |
| Focus restored on close | The next Tab starting from the top of the document |
| Page scroll locked, reference-counted | The page behind scrolling under the panel; and the lock outliving the last overlay |
| Escape and outside-press dismissal, stacked | One keystroke closing the menu *and* the dialog behind it |

`title` is required rather than optional. A modal with no accessible name is announced as
"dialog" and nothing else, which is the most common way this component is got wrong; wrap it in
`VisuallyHidden` if the design calls for no visible heading.

```tsx
import { Dialog } from "@yoltra/ds/client";
import "@yoltra/ds/styles/modal.css";

<Dialog open={open} onClose={close} title="Decommission satellite" description="This cannot be undone.">
  <Text>SAT-04 will stop reporting telemetry immediately.</Text>
</Dialog>;
```

### The anchored tier

`Popover`, `Menu` and `ContextMenu` are non-modal: they sit beside the page rather than over it,
so they trap nothing and lock nothing. They close on Escape, on an outside press, and when focus
leaves for something that is neither the surface nor its trigger. `Menu` adds the menu keyboard
pattern — focus moves to the first item on open and roves with the arrows, Home and End, wrapping
at both ends; Tab closes and continues past the trigger.

Each takes a `trigger` render prop and hands it the ARIA wiring:

```tsx
<Menu
  open={open}
  onClose={() => setOpen(false)}
  label="Satellite actions"
  trigger={(props) => <Button {...props} onClick={() => setOpen((v) => !v)}>Actions</Button>}
>
  <MenuItem onSelect={deploy}>Deploy panels</MenuItem>
  <MenuItem onSelect={boost} disabled>Boost orbit</MenuItem>
</Menu>
```

Handing over `aria-expanded`, `aria-haspopup` and `aria-controls` rather than documenting them is
deliberate: that wiring is the step that gets skipped, and a screen reader then describes a button
that appears to do nothing.

A disabled `MenuItem` carries `aria-disabled`, not the `disabled` attribute, so the arrow keys
still reach it. Being told an action is unavailable is better than not being able to find out it
exists.

`ContextMenu` anchors to a point instead of an element — `at={{ x, y }}` from a `contextmenu`
event, or `null` when closed. The placement maths treats a point as a zero-sized rectangle, so it
flips and clamps near the window edges exactly as an element-anchored menu does.

`Tooltip` is the exception to the controlled rule: its visibility belongs to the pointer and the
focus ring, not to application state. It never takes focus, and it is wired with
`aria-describedby` rather than `aria-label` — labelling with a tooltip leaves an icon button whose
name disappears when the tooltip does.

### Positioning

`resolvePlacement` is exported and pure. It flips only when the opposite side actually fits —
"whichever side has more room" sounds equivalent but moves an overlay taller than the window for a
few percent more visible area, which buys nothing and makes the position unpredictable. Clamping
applies to the cross axis only; clamping the main axis would slide the overlay over the very
element it is describing.

Positions are viewport coordinates against `position: fixed`, so there is no offset-parent
arithmetic — the usual source of "correct everywhere except inside that one scrolling panel".

**One limitation worth knowing.** The overlay is `position: fixed`, so an ancestor of the
*portal root* with a transform would still capture it — but the portal root is a direct child of
`document.body`, so in practice that means a transform on `<body>` itself.

## Size

Measured the way a consumer ships it — bundled, tree-shaken, minified, gzipped — and checked by
`rush size` on every build.

| Import | Size |
| --- | --- |
| `{ Button, Card, Stack, Text }` | 2.4 KB |
| everything | 5.4 KB |
| `{ Dialog }` from `/client` | 1.9 KB |
| all of `/client` | 4.5 KB |

The gap between the barrel rows and the named-import rows is tree-shaking working — `{ Dialog }`
did not move when the anchored tier landed, though the client barrel grew by two thirds. The barrel figure is a growth tripwire,
not a cost anybody pays; `import * as all` is not something people write.

These numbers are lower than before the stylesheet was split out, and that is not an
improvement — the CSS did not get smaller, it left the JavaScript bundle for files you import
deliberately. Add whichever component stylesheets you use when comparing.

## Authoring

Component styles are SASS, in `src/primitives/<Component>.scss` and `src/overlay/<Component>.scss`,
compiled one file per component by `scripts/build-styles.mjs`.

SASS never owns a *value*. Colours, spacing and radii are read as `var(--yl-*)`, because
theming is a runtime `data-theme` switch on the document root and a SASS variable compiles
away long before that switch happens. What SASS contributes is nesting, per-component files,
and the mixins in `src/styles/_mixins.scss` — focus ring, visually-hidden, breakpoints — which
were previously repeated fragments inside a template literal.

## License

MIT © Manu Ramirez
