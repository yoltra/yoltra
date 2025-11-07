# Kinetic logo of Quo.js (React + SVG)

![Quo.js logo](./public/assets/quojs-dots.gif)

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; | &nbsp;
> 👉 [ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp; [ 🇫🇷 Version française](./README.fr.md)

**A kinetic logo made of ~1.5k SVG circles, driven by a tiny simulation engine and synchronized with a Quo.js store.**  
This example lives in the Rush monorepo under:

```
examples/v0/quojs-dots
```

It showcases Quo.js as a **predictable, typed, event‑driven** state container with **fine‑grained subscriptions** that keep React re-renders lean—even when thousands of items update every frame.

---

## Why Quo.js here?

- **Channels + events (no action-type soup):** we dispatch on channel `"logo"` with events like `"batchUpdate"`, `"fps"`, etc.
- **Fine‑grained selectors:** each `<Circle/>` subscribes to its **own** `logo[group][id]` node via `useAtomicProp`, avoiding whole-slice re-renders.
- **Immutable, ergonomic reducer spec:** a single reducer (`Logo.reducer.ts`) handles atomic and batched updates without magic.
- **Typed hooks:** `createQuoHooks` generates `useStore`, `useDispatch`, `useSelector`, `useAtomicProp`, `useAtomicProps` with full TS inference.
- **Event effects:** the engine listens to store effects (e.g., `"logo":"start" | "stop"`) to coordinate simulation lifecycle.

The result: **smooth 60fps** updates on capable machines, with React only touching the DOM for circles that actually moved.

---

## How it works (high level)

1. **Engine + Simulation**  
   - `Engine` runs an `rAF` loop, smooths FPS, and dispatches `logo/fps` every ~250ms.
   - `Simulation` owns `Circle` items. Each item eases from a random start to its “home” pixel (the logo), then idles—repelled by the mouse and relaxing back.

2. **Image → specs (once)**  
   - `extractCircleSpecsFromImage()` samples a transparent PNG (`assets/logo.png`) to produce `CircleSpec[]` with `group: "d" | "u" | "x"`.  
   - We dispatch `logo/size` and `logo/count` so the UI knows canvas size and per‑group circle totals.

3. **Per‑frame updates → batched store writes**  
   - Each frame, `Simulation.loop()` collects item updates and dispatches **one** `logo/batchUpdate` with many changes.  
   - The reducer upserts only the nodes that changed, keeping the store small and React precise.

4. **Granular rendering**  
   - Every `<Circle group id>` subscribes to `logo[group][id]` via `useAtomicProp`. If a circle didn't move, it **doesn't re-render**.

5. **Intro completion + metrics**  
   - While intro runs, `logo/introProgress` tracks remaining movers. Once all are home, we dispatch `logo/introComplete`.

---

## Run it (Rush monorepo)

> Assumes you are at the **root** of the Quo.js monorepo.

1) **Install + build packages** (so the example can resolve `@quojs/*` workspaces)
```bash
rush install
rush build     # or: rush build -t quojs-dots
```

2) **Start the example dev server**
```bash
cd examples/v0/quojs-dots
rushx dev      # runs Vite
```

3) Open the printed local URL (usually `http://localhost:5173`). Move the mouse over the logo—dots orbit/avoid, then relax back home.

> Alternative from monorepo root:
```bash
rushx -p quojs-dots dev
```

---

## Project structure (key files)

```
src/
  App.tsx                       # boots Engine, extracts specs from the logo PNG, wires Simulation → Store
  components/screen/Screen.*    # screen shell (SVG), reads store.size, renders <Circle/> list
  components/screen/items/circle/
    Circle.component.tsx        # subscribes to its own logo[group][id] node via useAtomicProp
  context/Store.context.tsx     # React context for the typed Quo store
  state/
    types.ts                    # AppState, LogoState, typed action maps (LogoAM, AppAM)
    logo/Logo.reducer.ts        # immutable reducer; atomic + batched circle updates, fps, intro, size
    hooks.ts                    # createQuoHooks(...): typed React hooks
    store.ts                    # createStore(...) with the logo reducer
  utils/
    engine/                     # Engine (rAF loop), Simulation (items + quadtree), Circle item behavior
    image/                      # PNG → ImageData + extractor → CircleSpec[]
    Quadtree.ts                 # spatial index to query nearby circles on mouse move
    index.ts                    # numeric geometry helpers (expApproach, orbit/avoid, etc.)
  assets/logo.png               # source image for sampling
```

---

## Quo.js specifics shown here

- **`batchUpdate`**: one action, many updates → minimal reducer churn and fewer React commits.
- **`useAtomicProp`**: subscribe directly to a deep path (`logo["d"]["circle_d_42"]`). No memo foot-guns, no selectors allocating new objects each render.
- **Effect API** (`store.onEffect("logo", "start" | "stop")`): the engine reacts to state events without Redux‑saga/thunk ceremony.
- **Pure, immutable reducer**: `upsertItem()` enforces a no‑op when nothing changed → fewer updates propagate.

If you like this pattern in a toy demo, it scales cleanly to real UIs with thousands of nodes, streaming or animation workloads, and strict rendering budgets.

---

## Troubleshooting

- **Blank screen or fetch error**: ensure `assets/logo.png` resolves (Vite dev server) and the browser supports `createImageBitmap`. A fallback path exists, but some CSPs can block it.
- **Sluggish on low‑end devices**: lower `maxCircles` in `App.tsx` (e.g., 800) or increase extractor `spacing` (e.g., from `3` to `5`).
