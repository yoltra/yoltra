# ReducerActivityBars

A live SVG horizontal bar chart that shows how active each reducer slice has been, derived entirely from the JSON Patch operations already present in the event log.

## What problem it solves

The `SubscriptionsPanel` lists registered reducers as a plain text roster. It answers _"which reducers exist?"_ but nothing about runtime behaviour. `ReducerActivityBars` answers: _"which reducers are actually doing work?"_, _"which ones are idle?"_, and _"how deeply does each event mutate a given slice?"_ — without any additional instrumentation.

## Files

```
ReducerActivityBars.tsx          Component + data derivation logic
ReducerActivityBars.module.css   Scoped styles (CSS Modules)
```

## Integration

Requires two props already available in `App.tsx`: `entries` from `useEventLog` and `subscriptions` from `useStoreSubscriptions`.

**Step 1 — Add the tab**

```tsx
// App.tsx
const TABS = [
  "Events", "State", "Subscriptions", "Time Travel", "Emit", "Metrics",
  "Reducers", // ← add
] as const;
```

**Step 2 — Render the panel**

```tsx
import { ReducerActivityBars } from "./components/panels/visualizations";

{activeTab === "Reducers" && (
  <ReducerActivityBars entries={entries} subscriptions={subscriptions} />
)}
```

`subscriptions` is the `data` field from `useStoreSubscriptions(effectiveStoreId)`.

## Props

| Prop            | Type                    | Description |
|-----------------|-------------------------|-------------|
| `entries`       | `EventLogEntry[]`       | Live event log from `useEventLog`. Used to derive patch-based activity. |
| `subscriptions` | `SubscriptionData \| null` | Consumer metadata from `useStoreSubscriptions`. Used to seed the full reducer list. Pass `null` if unavailable — the component degrades gracefully. |

## Visual layout

```
┌─ Toolbar ─────────────────────────────────────────────┐
│  Window  [30s] [60s] [all]   Sort  [Activity] [Name]  │
├───────────────────────────────────────────────────────┤
│  todos    ████████████████████████  38   just now      │
│  counter  ████████████             21   2s ago         │
│  ui       █████                     9   8s ago         │
│  auth     ░░░░░░░░░░░░░░░░░░░░░░░░   0   never          │
├───────────────────────────────────────────────────────┤
│  ▼ todos                                              │
│  Events touched  Patch ops  Patches / event  Last active│
│  38              112         2.9              14:32:01  │
└───────────────────────────────────────────────────────┘
```

- **Name label** — the reducer's slice key (e.g. `todos`), monospace in accent colour.
- **SVG bar track** — full-width grey background rect.
- **SVG bar fill** — proportional fill rect. Blue (`--devtools-accent`) when the reducer was active within the last 5 seconds; muted grey (`--devtools-fg-muted`) when idle. Width transitions smoothly via a CSS `transition: width 0.3s ease-out`.
- **Event count** — integer count of events that produced at least one patch on this slice.
- **"Last active"** — elapsed time since the last patch, shown as `just now`, `Xs ago`, or `never`.

## How activity is measured (no extra instrumentation)

Every `EventLogEntry.patches` is an array of RFC 6902 JSON Patch operations. Because Yoltra's devtools agent namespaces all patch paths under the reducer slice key — `/reducerName/rest/of/path` — the first path segment directly identifies which reducer produced each patch.

```ts
// e.g. patch.path = "/todos/items/3/done"
//                    ↑ reducer name = "todos"
```

`deriveActivity` extracts this in a single O(n × p) pass (n = entries, p = patches per entry) with no protocol changes.

Two distinct metrics are tracked:

| Metric | What it counts |
|--------|----------------|
| `eventCount` | Events that caused **at least one** patch on this slice. An event increments `eventCount` by at most 1 per reducer, even if it produces many patches. |
| `patchCount` | Total individual patch operations (add, replace, remove) on the slice. An event that splices 10 items from an array produces 10 patch ops. |

The **patches / event** ratio in the expanded detail is the most insightful derived metric: a ratio of 1.0 means shallow mutations; a higher ratio reveals reducers that do bulk array work.

## Stable list with zero-activity reducers

The reducer list is seeded from `subscriptions.reducers` before the event log is scanned. Reducers registered in the store but with zero events in the active window are always shown at zero. This means:

- The list is **stable** — rows don't pop in or disappear as windows change.
- **Idle reducers are visible** — a reducer with an empty bar is immediately obvious.
- Reducers that appear in patches but are absent from `subscriptions.reducers` (edge case: reducers registered after the subscriptions fetch) are added dynamically to the map.

## SVG bar implementation

Each row's bar is a minimal inline SVG with no `viewBox`:

```tsx
<svg className={styles.barSvg} height={BAR_HEIGHT}>
  <rect width="100%" height={BAR_HEIGHT} rx={BAR_RADIUS} className={styles.barTrack} />
  <rect width={widthPct} height={BAR_HEIGHT} rx={BAR_RADIUS} className={...} />
</svg>
```

The fill `<rect>` uses a **percentage `width`** attribute (e.g. `"42%"`). SVG resolves percentage widths against the element's rendered width, so the bar automatically scales to its container without a `ResizeObserver` or pixel calculations.

The CSS `transition: width 0.3s ease-out` on `.barFillActive` and `.barFillIdle` produces a smooth grow/shrink animation when counts change between renders.

> **Note on CSS transitions for SVG `width`:** Browser support for transitioning the SVG `width` presentation attribute via CSS is broad but not universal. If you encounter issues, an alternative is to animate `transform: scaleX()` on a `<g>` wrapper with `transform-box: fill-box; transform-origin: left center`, which avoids the attribute transition entirely.

## Time windows

| Label | Filter |
|-------|--------|
| `30s` | Entries newer than 30 seconds |
| `60s` | Entries newer than 60 seconds |
| `all` | Entire in-memory log |

The `"all"` window shows cumulative totals since the log was last cleared. The `lastActiveAt` timestamp always reflects absolute wall-clock time regardless of window, so the "last active" label reads correctly even when a long window is selected.

## Sort modes

| Mode | Order |
|------|-------|
| Activity | Descending `eventCount`, then alphabetical by name as tiebreaker |
| Name | Alphabetical A–Z |

Both are stable sorts — equal items maintain a consistent relative order between renders.

## Idle threshold

A reducer transitions from "active" (blue bar) to "idle" (grey bar) when its `lastActiveAt` is more than `IDLE_THRESHOLD_MS = 5000` ms in the past. This is evaluated at render time using `Date.now()`, so bars naturally grey out over time without requiring a timer or interval.

> The component does not schedule any timers. The idle/active state updates the next time the component re-renders, which happens on every new event (since `entries` is a new array reference). In a quiescent store, the last render will show the correct elapsed time — it just won't update further until the next event arrives. If continuous idle-time updates are needed, add a `useEffect` with a 1-second interval that calls a dummy `setState` to force re-renders.

## Expanded detail

Clicking any row toggles an inline detail grid (only one row is expanded at a time):

| Stat | Description |
|------|-------------|
| Events touched | `eventCount` in the active window |
| Patch ops | `patchCount` in the active window |
| Patches / event | `patchCount / eventCount`, 1 decimal place |
| Last active | Wall-clock time of the last patch, via `toLocaleTimeString()` |

## Known limitations

- **`lastActiveAt` is not updated by window changes.** The timestamp reflects the most recent event in the entire log that touched the reducer, not only those in the active window. This is intentional — it answers "when did this reducer last do anything?" rather than "when did it last do anything recently?".
- **Idle bar colour uses CSS custom properties, not SVG attributes.** The `fill` of `.barTrack` and `.barFillIdle` is declared as `fill: var(--devtools-...)` in the CSS module. This works in all modern browsers but is technically outside the SVG specification. Fallback to hardcoded hex values if targeting older environments.
- **No absolute scale.** Bar widths are relative to the busiest reducer in the current list and window. A reducer that fires 1000 times looks the same as one that fires 1 time if it's the only reducer. The integer count badge provides the absolute number.

## Extension ideas

- **Colour by patch-depth** — instead of active/idle, colour the bar by the average nesting depth of patches, revealing structurally complex mutations.
- **Sparkline overlay** — draw a mini sparkline of event counts over time inside each bar track to show burstiness vs. steady throughput.
- **Click to filter** — clicking a reducer name could filter the `EventTimeline` to only show events that produced patches on that slice.
- **Configurable idle threshold** — expose `IDLE_THRESHOLD_MS` as a prop or user preference.
