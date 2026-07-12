# Change Log - @yoltra/devtools-storeview

This log was last generated on Sun, 12 Jul 2026 00:20:57 GMT and should not be manually modified.

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

