# Yoltra vs Redux Toolkit — React Profiler Comparison

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; | &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; | &nbsp;[ 🇫🇷 Version française](./README.fr.md)

A side-by-side React demo comparing fine-grained path subscriptions (Yoltra) against selector-based subscriptions (Redux Toolkit). Both implementations expose the same UI and user flows, making the **[React Profiler flamegraph comparison](./redux-yoltra-profiler.md)** a fair, apples-to-apples measurement.

The key result: when updating a single item in a list, Yoltra re-renders only the affected component. Redux Toolkit re-renders every component whose selector touches the changed slice. See the **[full profiler analysis](./redux-yoltra-profiler.md)** for flamegraphs and timing data.

Both implementations use:

- **Yoltra** — event-driven store with channel-based events and fine-grained subscriptions via `useAtomicProp`
- **Redux Toolkit (RTK)** — standard Redux stack with `createSlice` + `createAsyncThunk`

## Project layout

Both implementations expose the same UI and user flows (list, add, update, delete). The comparison shell mounts either page under separate routes so you can profile them in isolation.

- Route **/yoltra** → Yoltra page wrapped in its own provider
- Route **/rtk** → RTK page wrapped in its own provider

The app is a **Vite** project that lives inside a **Rush** monorepo.

## Prerequisites

- **Node.js**: LTS recommended (e.g. 18.x).  
- **pnpm**: used by Rush for dependency management  
  ```bash
  npm i -g pnpm
  ```
- **Rush** (global CLI)
  ```bash
  npm i -g @microsoft/rush
  ```

## Clone & bootstrap

Clone this repo, and then navigate to the repo folder and issue the following terminal commands:

```bash

# Install all dependencies for the monorepo
rush install          # or: rush update

# (optional) Build everything
rush build
```

## Run the app (dev)

The comparison shell is a Vite app that routes to each implementation.

```bash
cd examples/yoltra-in-react
rushx dev             # same as: pnpm dev
```

Open **http://localhost:5173** (or whatever Vite prints).

- Visit **/yoltra** for the Yoltra page.
- Visit **/rtk** for the RTK page.

## Production build & preview (for stable profiling numbers)

Dev builds include extra checks (e.g., React Strict Mode effects and development transforms). For more stable timing, profile a **production** build:

```bash
cd examples/yoltra-in-react
rushx build           # Vite production build
rushx preview         # Serves the production build
# default: http://localhost:4173
```

Then open `/yoltra` or `/rtk` on the preview server.

## Using the React Profiler

1. **Install React DevTools** in your browser (Chrome/Edge/Firefox).  
2. Open your app, then open DevTools → **Profiler** tab.
3. In the Profiler toolbar:
   - Turn on **“Record profiling”**.
   - Hit `Refresh` so the profiler also captures the fetching stage
   - (Optional) Enable *“Record why each component rendered”* for richer insights.
4. Interact with the page to capture specific frames:
5. Inspect the flamegraph for each commit:
   - Which components re-rendered?
   - How long did the commit take?
   - How much of the tree was invalidated?

### Exporting profiles
In the Profiler, click **Save profile…** to export a `.json` you can keep for reproducibility.

## Data source

The fetch example uses MSW with mock data from `https://jsonplaceholder.typicode.com/todos?id=0&limit=10` by default. You can change this in the actions/hooks if needed. Network access is not required by default and it must be allowed by your browser / dev proxy if you disable MSW.

## License

MIT

This demo is for comparison/documentation purposes.