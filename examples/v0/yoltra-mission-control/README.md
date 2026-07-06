# Orbital Mission Control — the flagship Yoltra + DevTools demo

A live satellite-fleet control room that puts every Yoltra feature — and the
**DevTools panel** — on one screen. No install, no hub server, no browser
extension: the store agent, the hub, and the panel all run in the page over an
in-memory loopback transport.

## What it shows

| Feature | Where to look |
|---|---|
| **Fine-grained reactivity** | Each satellite card shows a live **render counter**. Telemetry hits one satellite → only that card re-renders. No selectors, no memoization. |
| **Typed path accessors** | Cards subscribe with `useAtomicProp("fleet", p => p.satellites[i].battery)`. |
| **Wildcard subscriptions** | The header's *fleet battery* recomputes from `satellites.**`. |
| **Multiple slices** | `fleet` (telemetry + commands) and `mission` (clock + alerts). |
| **Event-sourcing + time-travel** | The panel's timeline fills automatically; scrub it to rewind the mission. |
| **Effects (async)** | *Deploy* / *Transmit* / *Boost* commit instantly, then complete a moment later via effects. |
| **Middleware (veto)** | *Boost* below 20% battery is rejected — it appears **uncommitted** in the timeline and raises an alert. |
| **DevTools** | The embedded `<DevtoolsApp/>` is the exact extension UI, over the loopback hub. |

## Run it

The example consumes Yoltra + the devtools suite from each package's built
`dist/`, so build them once, then start Vite:

```sh
rush build          # or: rush build --to yoltra-mission-control
cd examples/v0/yoltra-mission-control
pnpm dev
```

After editing a Yoltra package, rebuild just that one (e.g.
`rush build --only @yoltra/devtools-ui`) and reload.

## How the loopback works

```ts
import { createLoopbackHub } from "@yoltra/devtools-ui";

const loopback = createLoopbackHub();

// agent side
withDevtools(store, { port: 0, socketFactory: loopback.agentSocketFactory });

// panel side
<DevtoolsApp config={{ port: 0, WebSocket: loopback.WebSocket }} />
```

Both ends speak the real DevTools protocol; the loopback just carries it in
memory instead of over a WebSocket. Swap `socketFactory` / `WebSocket` back out
and the same app talks to the real hub + browser extension unchanged.
