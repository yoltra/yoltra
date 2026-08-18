# Change Log - @yoltra/devtools-storeview

This log was last generated on Tue, 18 Aug 2026 01:10:17 GMT and should not be manually modified.

## 0.6.0
Tue, 18 Aug 2026 01:10:17 GMT

### Minor changes

- Exports a named props interface for every published component - `TopBarProps`, `BottomBarProps`, `EventTimelineProps`, `InspectorProps`, `JsonTreeProps`, `FilterBarProps`, `ConnectionDotProps`, `MetricsDashboardProps`, `StateTreeExplorerProps`, `SubscriptionsPanelProps`, `EventEmitterPanelProps` and `TimeTravelPanelProps` - plus the `MetricsData` shape.

Each component took an inline anonymous object and documented it with `@param props.x` tags. TypeDoc cannot match those to a destructured parameter, so roughly thirty of them produced warnings and no rendered documentation: the props were described in the source and invisible in the reference. Naming the interfaces fixes both, and lets a consumer wrapping a component declare its own signature instead of restating the shape.

`SubscriptionData` was defined twice here and once more in @yoltra/devtools-ui. It is now imported from there, so the three copies cannot drift.

### Updates

- Fixes the documentation build: the TypeDoc entry point pointed at `src/index.ts` where the file is `src/index.tsx`, and `tsconfig.docs.json` named a `@types/node` dependency this package does not have. Also corrects the module description, which still described the package as UI for Quo.js — the name this project was renamed from in February 2026. No published code changes.

## 0.5.0
Sat, 15 Aug 2026 22:14:53 GMT

### Updates

- Names build outputs `.mjs` and `.cjs` instead of `.esm.js` and `.cjs.js`, and adds explicit extensions to the relative specifiers of published declaration files.\n\nNode infers a `.js` file's format from the nearest package.json `type` field, so the `require` condition resolved to a file parsed as ESM and threw `ReferenceError: exports is not defined in ES module scope` on a CommonJS consumer's first line. The declarations had the mirror problem: extensionless relative re-exports do not resolve under `moduleResolution: nodenext`, and because nearly every project sets `skipLibCheck: true` the errors were suppressed while every re-exported symbol silently degraded to `any` — a green build with no completions and no type checking, which is worse than a hard failure because nothing about it looks like one.

## 0.4.0
Fri, 07 Aug 2026 13:15:02 GMT

### Minor changes

- The time-travel panel offers event replay, which the UI package had implemented and exported and no panel ever called. Replay differs from scrubbing: time-travel sets the state at a point, replay re-runs the recorded events through the reducers alone — no effects, no middleware — which is how a reducer is checked against the transitions actually recorded. The action appears only when the store advertises the capability. The package also renders in its tests now rather than being asserted by reading it.

### Patches

- Tab availability moves into a tested module. The rule is small but it decides what a user may click, and inside the app component it could only be reached by rendering the whole panel against a mock hub. Both capabilities it consults default to off, so most stores support only part of the panel, and offering a tab whose controls silently do nothing is worse than not offering it. Switching stores now resolves through the same rule, so a panel left on Time Travel and pointed at a store that cannot replay falls back rather than sitting on dead controls.
- `TimeTravelPanelProps` is exported. The panel's props were declared inline, so no caller — including its own test — could name the type it renders from.

## 0.3.0
Sun, 12 Jul 2026 00:20:57 GMT

_Version update only_

## 0.2.0
Fri, 10 Jul 2026 07:51:29 GMT

### Minor changes

- Initial release: the devtools panel - filterable event timeline, live state tree, and precise per-event patch inspection driven by the core instrumentation seam.
- Redesigned the DevTools panel around a small design-system token layer (colour, type, space, radius, elevation, motion) applied through the existing semantic variables: a real shell layout, a focused Inspector / State / Time Travel / Metrics tab set, and a new Inspector view that foregrounds each event's changed leaf paths, new values, and payload. Metrics now shows the previously hidden avg-processing/queue-depth/dedup-hits figures and folds in the subscriptions inventory; Time Travel gained a reconstructed state preview. Fixed two CSS-delivery bugs so styles actually reach consumers: the runtime style injection now runs after Vite emits the CSS (enforce: post) instead of injecting an empty string, and the token stylesheet is plain CSS rather than a side-effect-only CSS module that was tree-shaken out. Dropped the nivo chart panels and their dependencies and externalized React subpath entrypoints, cutting the bundle from ~900KB to well under 100KB.

### Patches

- BottomBar now passes the selected store's replay capability to useTimeTravel, so the time-travel controls do not send commands to a store that cannot replay.
- react and react-dom moved from dependencies to peerDependencies (^18 || ^19), so a consuming app supplies its own copy and does not risk a second React instance (invalid hook call). They remain devDependencies for standalone builds.

