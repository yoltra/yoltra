![Yoltra logo](../../../assets/yoltra-logo.png)

# Yoltra: Kinetic logo animation

![Yoltra dots](../../../assets/yoltra-dots.gif);

> [🇲🇽 Versión en Español](./README.es.md) &nbsp; | 👉 🇺🇸 English Version&nbsp;

> A performant kinetic logo animation that showcases Yoltra's **atomic subscriptions**.

Every non-transparent pixel of the Yoltra logo becomes an independent dot. Up to **3000** dots
fly in from random positions and settle on their home pixel. Move your cursor across the canvas
to repel the dots; they ease back when you pull away.

---

## What this demo shows

| Yoltra feature        | Where it is used                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `useAtomicProp`       | Each `<PixelDot>` subscribes to exactly `pixel.dots.<id>` — only that component re-renders when its dot moves                                  |
| `when: { channel }`   | The reducer targets the entire `pixel` channel with a single matcher                                                                           |
| `store.onEffect`      | The `Engine` wires `pixel/stop` and `pixel/start` effects to the rAF loop; the `Simulation` wires `on/mousemove` effects to the quadtree query |
| `batchUpdate` reducer | Single-pass, lazy-allocation strategy: the `dots` record is spread **at most once per frame** regardless of how many dots moved                |

### Atomic subscriptions — the key insight

```
batchUpdate  →  reducer  →  store notifies 3000 subscribers
                             │
                             ├─ dot_0 unchanged  →  no re-render
                             ├─ dot_1 changed    →  re-render (cx, cy only)
                             ├─ dot_2 unchanged  →  no re-render
                             └─ …
```

A frame that moves 300 dots triggers exactly **300 React renders**, each updating two SVG
attributes. The other 2700 components stay frozen.

---

## Reducer performance design

The hot path is `batchUpdate`, called every animation frame.

**Old v0 approach (O(N_dots × N_changes) allocations):**

```ts
for (const c of changes) {
  // spreads state AND the group record for every single change
  state = { ...state, [group]: { ...state[group], [c.id]: next } };
}
return { ...state }; // redundant extra spread
```

With 500 changes all touching the same 3000-key record: ≈ 500 × 3000 = **1,500,000 property
copies** per frame.

**New v1 approach (O(N_dots + N_changes) — at most 2 allocations):**

```ts
let nextDots: Record<string, Dot> | null = null;

for (const c of changes) {
  const prev = (nextDots ?? state.dots)[c.id];
  if (c.x !== prev?.x || c.y !== prev?.y) {
    if (!nextDots) nextDots = { ...state.dots }; // ONE spread, lazily
    nextDots[c.id] = { id: c.id, x: c.x, y: c.y, color: prev?.color ?? c.color };
  }
}
return nextDots ? { ...state, dots: nextDots } : state;
```

Same frame: 1 × 1 000 (dots spread) + 1 × handful (state spread) = **~1 000 property copies**.

---

## Running locally

```bash
# from the repo root
rush install
cd examples/v1/yoltra-pixel-logo
pnpm dev
```

Then open `http://localhost:5173`.

---

## Architecture

```
src/
├── App.tsx                        Bootstrap: load image → extract specs → start engine
├── state/
│   ├── types.ts                   AppState / AppEM / Dot / DotUpdate
│   ├── store.ts                   createStore()
│   ├── hooks.ts                   createQuoHooks() — typed useAtomicProp etc.
│   └── pixel/
│       └── Pixel.reducer.ts       Optimised reducer for the `pixel` channel
├── context/
│   └── Store.context.tsx          React context holding the store
├── components/
│   └── screen/
│       ├── Screen.component.tsx   SVG canvas + pointer events
│       └── items/dot/
│           └── Dot.component.tsx  One dot → one atomic subscription
└── utils/
    ├── index.ts                   Math helpers (expApproach, orbit, clamp…)
    ├── Quadtree.ts                Generic QuadTree<T extends PointItem>
    ├── image/
    │   ├── imagePixels.ts         PNG → ImageData via OffscreenCanvas
    │   └── extract.ts             Pixel scan + reservoir sampling → DotItemSpec[]
    └── engine/
        ├── Engine.ts              rAF loop, FPS smoothing, effect subscriptions
        ├── Simulation.ts          Item pool, quadtree, mouse handler
        ├── DotItem.ts             Per-dot physics (expApproach + orbit)
        └── SimulationItem.ts      Abstract base class
```

---

## Customisation

| Option             | Location                                | Default             |
| ------------------ | --------------------------------------- | ------------------- |
| Max dots           | `App.tsx` → `MAX_DOTS`                  | `3000`              |
| Logo image         | `src/assets/logo.png`                   | Yoltra logo         |
| Target FPS         | `App.tsx` → `new Engine({ targetFPS })` | `60`                |
| Mouse repel radius | `DotItem.ts` → `INTERACT_RADIUS`        | `8 px`              |
| Approach speed     | `extract.ts` → `factor` option          | random `[3, 7]`     |
| Intro delay        | `extract.ts` → `delay` option           | random `[0, 0.8 s]` |

# License

GPL-2.0-only - **Yoltra Kinetic Logo** project is for comparison/documentation purposes.
