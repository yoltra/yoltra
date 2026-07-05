# EventFrequencyHeatmap

A two-dimensional frequency heatmap that turns the flat event log into a grid where rows are channels, columns are event types, and cell intensity encodes how often each pair has fired.

## What problem it solves

The existing `EventTimeline` is a chronological list — useful for inspecting individual events but poor for answering questions like _"which event fires the most?"_, _"which channel is noisiest right now?"_, or _"is this event being rejected consistently?"_. The heatmap answers all three at a glance.

## Files

```
EventFrequencyHeatmap.tsx          Component + data derivation logic
EventFrequencyHeatmap.module.css   Scoped styles (CSS Modules)
```

## Integration

The component needs only the `entries` array from `useEventLog`, which is already available in `App.tsx`.

**Step 1 — Add the tab**

```tsx
// App.tsx
const TABS = [
  "Events", "State", "Subscriptions", "Time Travel", "Emit", "Metrics",
  "Heatmap", // ← add
] as const;
```

**Step 2 — Render the panel**

```tsx
import { EventFrequencyHeatmap } from "./components/panels/visualizations";

// Inside the panel content block:
{activeTab === "Heatmap" && <EventFrequencyHeatmap entries={entries} />}
```

That's all. No new hooks, no new protocol messages.

## Props

| Prop      | Type               | Description                                      |
|-----------|--------------------|--------------------------------------------------|
| `entries` | `EventLogEntry[]`  | Live event log from `useEventLog(effectiveStoreId)`. |

## Visual layout

```
┌─ Toolbar ────────────────────────────────────────────────┐
│  Window  [1s] [10s] [60s] [all]          3 pairs · 42 ev │
├──────────────────────────────────────────────────────────┤
│  ui      [increment ██]  [decrement █]  [reset ░]        │
│  admin   [delete ████████████████]                       │
│  network [fetch ░]                                       │
├──────────────────────────────────────────────────────────┤
│  ui::increment                               ✕           │
│  Total fired  Committed  Rejected  Rate  Last fired       │
│  24           24         0         0%    14:32:01         │
└──────────────────────────────────────────────────────────┘
```

- **Rows** — unique channel names, sorted alphabetically.
- **Columns** — event types within each channel, sorted alphabetically.
- **Cell intensity** — background opacity on a `[0.08, 1.0]` scale, normalised so the most frequent pair is always fully opaque. This means relative hotspots remain visible even when one pair completely dominates.
- **Cell hue** — blue (`--devtools-accent`) when committed events dominate; shifts to red (`--devtools-bounced`) once the rejection rate exceeds 50%.
- **Flash** — a `brightness` keyframe animation plays on any cell whose count increases, providing a live pulse effect without additional React state.

## Time windows

The toolbar offers four rolling windows:

| Label | Filter |
|-------|--------|
| `1s`  | Entries newer than 1 second |
| `10s` | Entries newer than 10 seconds |
| `60s` | Entries newer than 60 seconds |
| `all` | Entire in-memory log (no filter) |

Switching windows re-filters the existing `entries` array in a `useMemo` — the log itself is never cleared or re-fetched.

## Detail panel

Clicking a cell opens a stats panel pinned to the bottom of the component. It shows:

- **Total fired** — total count in the active window.
- **Committed** — events that passed all middleware (`committed === true`).
- **Rejected** — events blocked by middleware (`committed === false`).
- **Rejection rate** — `rejectedCount / count`, formatted as a percentage.
- **Last fired** — `toLocaleTimeString()` of the most recent occurrence.

Clicking the same cell again, or the ✕ button, closes the panel. If the window changes and the selected pair drops out of scope, the selection is cleared automatically.

## Data derivation

All derived data is computed by `deriveHeatmapData(entries, windowMs)` inside a `useMemo` keyed on `[entries, activeWindow]`. The function makes a single O(n) pass over the entries array and returns:

- `cells` — `Map<"channel::type", HeatCell>` with aggregated stats.
- `channels` — sorted unique channel names (for row generation).
- `types` — `Map<channel, string[]>` of sorted type names per channel (for column generation).

The `maxCount` across all cells is computed in a second, O(m) pass over the cells map (where m = unique pairs, always ≤ n).

### Intensity formula

```
opacity = MIN_INTENSITY + (count / maxCount) × (1 - MIN_INTENSITY)
```

`MIN_INTENSITY = 0.08` ensures every cell with at least one event is perceptibly coloured rather than invisible.

## Flash implementation

Flash is implemented via direct DOM manipulation rather than React state to avoid cascading re-renders on high-frequency streams.

On every render, a `useEffect` (with no dependency array, so it runs after each render) compares the current cell counts against `prevCountsRef`. For any cell whose count increased:

1. `data-flash="true"` is set on the DOM element identified by `data-cell-key="{channel::type}"`.
2. A 800 ms `setTimeout` removes the attribute.
3. The CSS rule `.cell[data-flash="true"]` triggers a `@keyframes cellFlash` animation.

This pattern keeps React's render cycle decoupled from animation timing. If you need to track flash state in React (e.g. to extend the feature), consider a `useState<Set<string>>` instead and clear entries via `setTimeout`.

## Colour system

Cell background colours are applied as inline `style` because they depend on both a runtime-computed opacity and a conditional hue. The two raw RGB values are hardcoded to match the CSS custom properties:

| Condition | Colour |
|-----------|--------|
| `rejectionRate ≤ 50%` | `rgba(0, 122, 204, opacity)` — `--devtools-accent` |
| `rejectionRate > 50%` | `rgba(244, 71, 71, opacity)` — `--devtools-bounced` |

If you change `--devtools-accent` or `--devtools-bounced` in `variables.module.css`, update these hardcoded values accordingly. A future improvement would be to read the rendered CSS variable values at mount time via `getComputedStyle`.

## Known limitations

- **New channels/types appear at grid build time.** The grid structure is derived from entries currently in the active window. If a channel only has events older than the selected window, it disappears from the grid. This is intentional — "all" always shows the full picture.
- **Hue threshold is binary (50%).** The shift from blue to red is a step function, not a gradient. A linear interpolation between the two RGB values would produce a smoother signal.
- **Flash uses `document.querySelector`.** This is intentional for perf reasons but means the component does not support SSR. If SSR support is ever needed, move flash to React state.

## Extension ideas

- **Export button** — serialize `cells` to CSV for pasting into a spreadsheet.
- **Highlight on hover** — when hovering a cell, highlight all entries in the `EventTimeline` for that pair.
- **Threshold colouring** — user-configurable count threshold above which cells switch to a warning colour, regardless of rejection rate.
- **Gradient hue** — linearly interpolate RGB between accent and bounced based on exact rejection rate rather than the 50% threshold.
