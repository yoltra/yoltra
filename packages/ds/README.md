![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/ds

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; | 👉 🇺🇸 English Version &nbsp;

[![npm version](https://img.shields.io/npm/v/@yoltra/ds)](https://www.npmjs.com/package/@yoltra/ds)
[![npm downloads](https://img.shields.io/npm/dm/@yoltra/ds)](https://www.npmjs.com/package/@yoltra/ds)
[![types](https://img.shields.io/npm/types/@yoltra/ds)](https://www.npmjs.com/package/@yoltra/ds)
[![License](https://img.shields.io/npm/l/@yoltra/ds)](https://github.com/yoltra/yoltra/blob/main/LICENSE)

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
| `foundationTokens` | Primitives: palette, type scale, spacing, radius, elevation, motion. Not themed. |
| `lightTheme` / `darkTheme` / `themes` | Semantic roles (background/foreground/border/interactive/status). |
| `themeCss()` | Emits the `--yl-*` custom properties for both themes. **Properties only**, no component rules. |
| `ThemeProvider` / `useTheme` / `applyTheme` | Generic theme controller (reflects onto `data-theme`). |
| `noFlashScript()` / `THEME_STORAGE_KEY` | The inline script that restores the theme before the first paint, and the key it shares with the provider. |
| `Heading`, `Text`, `Link`, `InlineCode`, `Kbd` | Typography. |
| `Button`, `ButtonLink`, `IconButton`, `ButtonGroup` | Actions. |
| `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `RadioGroup`, `Switch`, `Slider`, `Label`, `FormField`, `Fieldset` | Form controls and their labelling. |
| `Card`, `Container`, `Stack`, `Inline`, `Grid`, `Divider`, `AuthCard` | Layout and composition. |
| `Badge`, `Chip`, `Callout`, `Stat`, `StatGrid` | Status and figures. |
| `Spinner`, `Skeleton`, `ProgressBar`, `EmptyState` | Feedback: indeterminate, determinate, and nothing-to-show. |
| `Table`, `TableScroll`, `THead`, `TBody`, `TR`, `TH`, `TD` | Presentational table parts. |
| `CodeBlock`, `Tabs`, `VisuallyHidden` | Everything else. |
| `Portal`, `Dialog`, `Drawer` | Modal overlays, rendered outside the tree. See below. |
| `Popover`, `Menu`, `MenuItem`, `MenuSeparator`, `ContextMenu`, `Tooltip` | Anchored overlays, positioned against a trigger or a point. |
| `useFocusTrap`, `useDismiss`, `useReturnFocus`, `useScrollLock`, `focusableWithin`, `resolvePlacement` | The behaviours those overlays are built from, for a surface they do not cover. |
| `useControllableState` | One value that is either the caller's or the component's, for building a control of your own. |

Every component keeps a `README.md` beside its source, with runnable examples and its
accessibility contract: [`src/primitives/Button/README.md`](src/primitives/Button/README.md) and
so on for each.

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

<!-- size-table:start -->
| Import | Size | Budget |
| --- | --- | --- |
| `{ Button, Card, Stack, Text }` | 0.9 KB | 1.2 KB |
| everything | 6.4 KB | 8 KB |
| `{ Dialog }` from `/client` | 1.8 KB | 3 KB |
| all of `/client` | 4.8 KB | 5.5 KB |
<!-- size-table:end -->

The gap between the barrel rows and the named-import rows is tree-shaking working — `{ Dialog }`
did not move when the anchored tier landed, though the client barrel grew by two thirds. The barrel figure is a growth tripwire,
not a cost anybody pays; `import * as all` is not something people write.

These numbers are lower than before the stylesheet was split out, and that is not an
improvement — the CSS did not get smaller, it left the JavaScript bundle for files you import
deliberately. Add whichever component stylesheets you use when comparing.


## Tokens

Three tiers, and a component may only read the middle one.

**Primitives** are raw values: `--yl-space-4`, `--yl-radius-md`, `--yl-breakpoint-lg`,
`--yl-text-h1-size`, `--yl-motion-duration-fast`. They carry no intent, so they survive a theme
switch by not participating in one.

**Semantic roles** say what a colour is *for*, and are the only colours a stylesheet should
name: `--yl-color-bg-canvas`, `--yl-color-fg-muted`, `--yl-color-interactive-bg`,
`--yl-color-status-error-fg`. Each has a light and a dark value, so a component that reads a
role is themed for free. `--yl-color-interactive-track` is the unfilled part of a control, the
groove a switch knob slides along, and holds 3:1 against the knob in both themes.

**Component locals** stay in the component's own stylesheet, prefixed without `--yl-`, deriving
from a role. A dialog's width is nobody else's business.

The palette is deliberately **not** emitted. A stylesheet that can reach `primary[500]` has
bypassed the layer that makes theming work, and every question CSS actually asks is "which blue
*for what*".

### The tokens nobody reaches for

Colour discipline tends to look after itself. Everything else gets rewritten by hand, so it is
worth saying plainly what is already here:

| Instead of | Read |
| --- | --- |
| `z-index: 10` | `--yl-z-base`, `--yl-z-sticky`, `--yl-z-overlay`, `--yl-z-popover`, `--yl-z-tooltip` |
| `box-shadow: 0 12px 40px rgb(0 0 0 / 25%)` | `--yl-elevation-xs` … `--yl-elevation-xl` |
| `transition: all 0.2s ease` | `--yl-motion-duration-{fast,normal,slow}` with `--yl-motion-ease-{standard,emphasized,decelerated}` |
| `@media (min-width: 768px)` | `--yl-breakpoint-{sm,md,lg,xl}` |
| `max-width: 720px` | `--yl-container-{md,lg,xl}` |
| `font-variant-numeric: tabular-nums` | `--yl-font-numeric`, so figures that tick do not shift their own column |
| `font-weight: 650` | `--yl-font-weight-{regular,medium,semibold,bold,extrabold}` |
| `border: 1px solid` | `--yl-border-width-{thin,medium,thick}` |

A `z-index` picked by hand is right until the day two of them meet. The rest is the same story in
a different unit.

### The type scale

Twelve roles, each emitted one axis at a time so a caller can take the size without inheriting
the weight:

```css
.title {
  font-size: var(--yl-text-h2-size);
  font-weight: var(--yl-text-h2-weight);
  line-height: var(--yl-text-h2-leading);
  letter-spacing: var(--yl-text-h2-tracking);
}
```

Roles: `hero`, `h1`–`h4`, `body-lg`, `body`, `body-sm`, `label`, `button`, `caption`, `code`.
Axes: `size`, `weight`, `leading`, `tracking`, `family`, `transform`. An axis a role does not set
is not emitted, so it cannot override an inherited value with nothing.

### The dark theme is the brand

Its surfaces are not hand-picked. Each one is mixed from the brand pair, carbon `#0F172A` and
the deepest brand blue `#123F68`, so a dark interface reads as blue-black rather than neutral
grey, and a brand change moves the whole theme instead of leaving it behind:

```
panel    = carbon + 16% brand blue
canvas   = that, 34% toward black
subtle   = that, 16% toward black
inset    = that, 52% toward black
elevated = that, 30% toward neutral[800]
```

The light theme carries the brand in its accents instead, where it belongs on a white page:
interactive fills, links, focus rings, and a canvas tinted with `primary[50]`.

### Brand colour and contrast

`--yl-color-brand-primary` is `#1A7FE2`. At 4.06:1 on white that is enough for a logo or display
type and **not** enough for body copy, so text that should look branded reads
`--yl-color-fg-brand`, a step darker at 5.38:1. Button fills use `--yl-color-interactive-bg`,
which is the same step.

`tests/contrast.test.ts` computes every pairing in both themes and fails below 4.5:1 for text or
3:1 for a focus ring or a status accent. Disabled text is exempt, per WCAG 1.4.3, and asserted
to *stay* below the threshold so it keeps looking disabled.

### Upgrading from 0.3.x

Thirty-eight properties were renamed. `scripts/token-rename-map.json` is the full map and
`scripts/codemod-tokens.mjs` applies it. Both ship in the package, so this runs against an
installed copy with nothing to clone:

```bash
node node_modules/@yoltra/ds/scripts/codemod-tokens.mjs --write 'src/**/*.{css,scss,ts,tsx}'
```

One rename needs a human: `--yl-color-brand` maps mechanically to `--yl-color-brand-primary`,
which is right for decoration and wrong for text. The codemod prints the sites it touched and
what to use instead.

The default density is one step tighter on the 4px grid, and no codemod touches it: a `md`
button is 36px tall rather than 44px, and cards, modals, popovers, tables and the default layout
gaps come down with it. The spacing scale itself is unchanged. A layout that needs the old touch
target asks for it with `size="lg"`, which is 44px.

## Authoring

Component styles are SASS, in `src/primitives/<Component>/<Component>.scss` and
`src/overlay/<Component>/<Component>.scss`, compiled one file per component by
`scripts/build-styles.mjs`. The compiled name comes from the basename, so `Button/Button.scss`
still publishes as `button.css`.

SASS never owns a *value*. Colours, spacing and radii are read as `var(--yl-*)`, because
theming is a runtime `data-theme` switch on the document root and a SASS variable compiles
away long before that switch happens. What SASS contributes is nesting, per-component files,
and the shared mixins. A component starts with `@use "../styles" as *;` and has all of them in
scope: `focus-ring`, `focus-field`, `visually-hidden`, `media-up`, `reduced-motion`,
`disabled-text`, `disabled-control`, `transition`, `surface`, and `type()`, which applies a whole
type role at once.

stylelint holds the line: a hex, an `rgba()`, a literal font size or a literal font weight in a
component stylesheet is a lint error. Reach for a role or a token instead.

## License

MIT © Manu Ramirez
