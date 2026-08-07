# Web Store listing copy

Source of truth for the Chrome Web Store submission. Kept in the repository so the listing is
reviewed like anything else that ships, rather than being retyped into a form from memory.

## Name

Yoltra DevTools

## Short description (132 characters max)

> Inspect Yoltra state: event timeline, state tree, subscriptions, metrics and time-travel — in
> your browser's DevTools.

(117 characters.)

## Detailed description

Yoltra DevTools shows what a Yoltra store is doing, while it does it.

**Event timeline.** Every event, in order, with the exact state paths it changed. Vetoed events
appear too, marked as uncommitted — a rule that silently blocked something is otherwise invisible.

**State tree.** The live state, updated by precise per-event patches rather than repeated full
snapshots.

**Time travel.** Scrub the recorded history and watch the state rebuild. Replay the events through
your reducers alone — no effects, no middleware — to check that a reducer does what the recorded
transitions say it does.

**Metrics.** Reduce timing, dedup hits, queue depth, and an inventory of the reducers, effects,
middleware and subscriptions actually registered.

**No setup for the usual case.** With the extension installed, a page running `withDevtools()` is
inspected directly — no server to start. A local hub is still there for Node processes and remote
sessions, where a socket is the only way in.

## Category

Developer Tools

## Privacy

Collects nothing. Sends nothing anywhere. See PRIVACY.md, published alongside the listing.

## Permission justifications

Reviewers ask for these individually.

- **storage** — remembers the hub host and port between sessions. Nothing else is stored.
- **Content script on http/https** — relays protocol frames between an inspected page and the
  DevTools panel. It reads only messages tagged for this extension.
- **Background service worker** — pairs a page with the panel inspecting its tab, forwarding
  frames without reading them.

No host permissions, no `tabs`, no remote network access.

## Assets required before submitting

- [ ] 128×128 icon — `public/icons/logo-128.png` ✔
- [ ] At least one 1280×800 or 640×400 screenshot — **not yet produced**
- [ ] Small promo tile 440×280 — optional, not produced
- [ ] Privacy policy URL — publish `PRIVACY.md` at a stable address
- [ ] Single-purpose statement: "Inspecting Yoltra application state during development."

## Before each submission

1. `rushx package` — builds and produces `store/yoltra-devtools-<version>.zip`.
2. Confirm the version in `package.json` and `public/manifest.json` match. They are meant to
   track the rest of the devtools suite.
3. Load the zip contents unpacked and confirm the bridge attaches to a page with no hub running,
   since no automated test in this repository can exercise extension runtime.
