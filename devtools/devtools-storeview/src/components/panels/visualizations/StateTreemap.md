# StateTreemap

A zoomable SVG treemap that visualises the entire store state as a proportional area chart. Rectangle area encodes approximate JSON byte-size; recently patched cells glow in accent colour.

## What problem it solves

The existing `StateTreeExplorer` is a JSON tree — accurate and inspectable, but it gives no sense of _proportion_. A `todos` slice with 500 items looks the same as a `ui` slice with two booleans. `StateTreemap` makes weight immediately visible: heavy slices occupy more screen space, and recently changed ones are easy to spot without scrolling.

## Files

```
StateTreemap.tsx          Component + layout algorithm + tree builder
StateTreemap.module.css   Scoped styles (CSS Modules)
```

## Integration

Requires three values from `App.tsx`: `state` and `loading` from `useStoreState`, and `entries` from `useEventLog`.

**Step 1 — Add the tab**

```tsx
// App.tsx
const TABS = [
  "Events", "State", "Subscriptions", "Time Travel", "Emit", "Metrics",
  "Treemap", // ← add
] as const;
```

**Step 2 — Render the panel**

```tsx
import { StateTreemap } from "./components/panels/visualizations";

{activeTab === "Treemap" && (
  <StateTreemap state={state} loading={stateLoading} entries={entries} />
)}
```

## Props

| Prop      | Type              | Description |
|-----------|-------------------|-------------|
| `state`   | `unknown`         | Current store state from `useStoreState`. Accepts any object; non-objects render an empty state message. |
| `loading` | `boolean`         | Whether a state fetch is in progress. Shows a loading message if `true` and `state` is still `null`. |
| `entries` | `EventLogEntry[]` | Event log from `useEventLog`. Used to determine which cells were recently patched and should be tinted. |

## Visual layout

```
┌─ Breadcrumb ──────────────────────────────────────────┐
│  state › todos › items                                │
├───────────────────────────────────────────────────────┤
│                    │                    │             │
│   todos            │   counter          │   ui        │
│   412 keys · ~8kB  │   1 keys · ~12B    │  3 keys·~6B │
│                    │                    │             │
│  (hot — blue tint) │                    │             │
│                    │                    │             │
├───────────────────────────────────────────────────────┤
│  todos.items  ~8012B   "..."                          │
└───────────────────────────────────────────────────────┘
```

- **Area** — proportional to `JSON.stringify(value).length` of each subtree. Large data occupies large rectangles.
- **Blue tint** — cells whose top-level reducer slice was patched in the last 3 seconds receive a `color-mix` tint of `--devtools-accent`. The tint resets on every `entries` update, so it effectively fades when no new events arrive.
- **Leaf shade** — leaf nodes (primitive values) use a slightly lighter fill (`--devtools-bg-secondary`) to visually distinguish them from expandable nodes.
- **Labels** — the key name and a secondary hint (value preview or child count + size estimate) are shown when cell area ≥ `MIN_LABEL_AREA` (3,000 SVG units²). Smaller cells show no label to avoid clutter.
- **Tooltip** — a fixed-height bar pinned below the SVG shows the full dot-path, size estimate, and value preview (up to 120 chars) for the hovered cell.

## SVG coordinate system

The treemap uses a fixed logical viewBox of `1000 × 600` SVG user units with `preserveAspectRatio="none"`:

```tsx
<svg viewBox="0 0 1000 600" preserveAspectRatio="none" width="100%" height="100%">
```

The layout algorithm operates in this coordinate space. The SVG element stretches to fill its flex container automatically. This eliminates the need for a `ResizeObserver` or `useLayoutEffect` dimension tracking entirely — a resize simply scales the SVG without requiring a layout recalculation.

> **Trade-off:** `preserveAspectRatio="none"` means cells stretch non-uniformly as the panel is resized. A squarified layout algorithm (which produces more square cells) would partially mitigate this, but it's a more complex algorithm. See the [Extension ideas](#extension-ideas) section.

## Layout algorithm

The treemap uses a **slice-and-dice** algorithm implemented in `layoutTreemap()`. It alternates the partition axis by depth:

- **Even depth** (0, 2, 4, …) — horizontal partition: nodes placed left-to-right, each taking a fraction of the total width proportional to its size.
- **Odd depth** (1, 3, 5, …) — vertical partition: nodes placed top-to-bottom.

```
Depth 0 (horizontal):  [todos (82%)] [counter (1%)] [ui (17%)]
                              ↓
Depth 1 (vertical, inside todos):
                        [title (5%)]
                        [done  (3%)]
                        [items (92%)]
```

The algorithm is O(n) per depth level and O(n × maxDepth) overall. Cells with area below `MIN_CELL_AREA = 200` SVG units² are omitted from the output entirely.

### Why not squarified?

The squarified treemap algorithm (Bruls, Huizing, van Wijk, 2000) produces cells with aspect ratios closer to 1:1, which are easier to read and label. It is, however, significantly more complex to implement — roughly 4× the code — and produces a less stable layout (cells can jump position as data changes). For the typical Yoltra state tree (3–10 top-level keys, shallow nesting), slice-and-dice produces a readable result. If your store has many small sibling keys, consider replacing `layoutTreemap` with a squarified implementation; it is a pure function with the same signature.

## Tree construction

`buildTree(value, key, parentPath, depth)` recursively converts the state object into a `TreemapNode` tree:

- **Objects** → node with children from `Object.entries`.
- **Arrays** → node with children from index-keyed entries (`"0"`, `"1"`, …).
- **Primitives and `null`** → leaf node; size = `JSON.stringify(value).length`.
- **Depth ≥ `MAX_DEPTH = 6`** → forced leaf to prevent stack overflow on deeply nested or circular state.

Parent node sizes are the sum of their children's sizes, floored at 1. This means a parent node's area is always at least as large as any of its children.

## Drill-down navigation

`rootPath` is a `string[]` state tracking which keys have been navigated into. The `currentNode` memo traverses the tree following this path.

```
rootPath = []             → show state root children
rootPath = ["todos"]      → show todos slice children
rootPath = ["todos","items"] → show items array children
```

Clicking a cell with children appends its key to `rootPath`. Clicking a breadcrumb crumb navigates back to `rootPath.slice(0, i)`. If a key in `rootPath` no longer exists in the tree (because state was replaced), the path automatically resets to root.

## Recent-change highlighting

`recentlyChangedKeys(entries)` returns a `Set<string>` of top-level reducer slice keys patched within the last `HOT_THRESHOLD_MS = 3000` ms. It walks the entries array backwards and short-circuits as soon as it exits the hot window:

```ts
for (let i = entries.length - 1; i >= 0; i--) {
  if (entry.timestamp < cutoff) break; // stop early
  // collect patch path first segments
}
```

At the root level, a cell is hot when `hotKeys.has(node.key)`. When drilled in, all visible cells belong to the same top-level slice (`rootPath[0]`), so the hotness is uniform — either the whole drilled view is hot or none of it is.

> The hot tint resets every time `entries` changes (every new event). In a quiescent store, the last render will correctly show cells as hot or not, and they will remain in that state until the next event arrives (which may push old patches out of the 3-second window). If you need continuous fade-out, add a 1-second interval that forces a re-render, or switch `HOT_THRESHOLD_MS` to a per-render `Date.now()` comparison with a `useState` timer.

## Label truncation

SVG text does not wrap or clip automatically. `truncateLabel(label, cellWidth)` estimates the maximum number of characters that fit using the approximation **1 character ≈ 7 SVG user units** (valid for monospace ~12px text at the 1000-unit viewBox scale):

```ts
const maxChars = Math.floor((cellWidth - 12) / 7);
```

This is a rough heuristic. For pixel-accurate truncation, replace it with:

```ts
// Inside a useEffect after rendering:
const textEl = ref.current;
while (textEl.getComputedTextLength() > availableWidth) {
  textEl.textContent = textEl.textContent!.slice(0, -2) + "…";
}
```

or with an off-screen `canvas.measureText()` call.

## CSS classes for SVG elements

SVG elements cannot use CSS Modules for dynamic per-instance styles (no `style` attribute on `<text>` for layout). Fill colours are applied via CSS class selectors in the module:

| Class | Applied when |
|-------|-------------|
| `.cell` | Every rect — base fill (`--devtools-bg-tertiary`) and stroke. |
| `.cellHot` | Top-level reducer patched within `HOT_THRESHOLD_MS`. Uses `color-mix`. |
| `.cellHovered` | Mouse is over this cell. Overrides `.cellHot` via specificity. |
| `.cellLeaf` | Node has no children. Slightly lighter fill. |
| `.cellKey` | `<text>` for the key label. |
| `.cellValue` | `<text>` for leaf value preview. |
| `.cellChildCount` | `<text>` for child count + size hint. |

> **`color-mix` support:** The `.cellHot` rule uses `color-mix(in srgb, ...)`, which is supported in Chrome 111+, Firefox 113+, and Safari 16.2+. For older targets, replace with a hardcoded `rgba` value matching 20% opacity of `--devtools-accent` against `--devtools-bg-tertiary`.

## Known limitations

- **Size is approximated from JSON, not actual memory.** `JSON.stringify(value).length` does not account for JS object overhead, prototype chains, or non-serialisable values. It is a useful proxy for "how much data is here" but not a memory profiler.
- **Arrays with many items can produce tiny, unlabelled cells.** An array of 200 todo items will produce 200 cells, most of which fall below `MIN_LABEL_AREA`. Drilling into the array will show them proportionally, but individual item cells may still be too small. Consider aggregating array children above a configurable threshold.
- **Drill-down is one level at a time.** Clicking a cell navigates into its immediate children. There is no "jump to path" shortcut. The breadcrumb provides navigation back.
- **`color-mix` in CSS** — see note above on browser support.
- **Non-serialisable state values** — if any state value cannot be `JSON.stringify`-ed (e.g. a `Function`, `Symbol`, or circular reference), `buildTree` will assign it a `size` of 1 (the fallback for `.length ?? 1`). The cell is still rendered but with minimal area.

## Extension ideas

- **Squarified layout** — replace `layoutTreemap` with a squarified algorithm for better aspect ratios, especially on wide/flat state trees.
- **Continuous hot fade** — replace the binary hot/not system with a continuous opacity that fades over `HOT_THRESHOLD_MS` using `Date.now() - lastPatchTime` as the interpolation input. Requires a `requestAnimationFrame` loop or a short interval.
- **Click-to-diff** — clicking a cell could open a side-by-side diff of that slice's state before and after the most recent event, using the existing `patches` data.
- **Size units toggle** — add a toolbar button to switch the size metric between JSON byte-length (current), number of leaf nodes, and number of direct children.
- **Array aggregation** — when a node is an array with more than N items, group them into chunks (0–9, 10–19, …) so the treemap shows bands rather than hundreds of tiny cells.
