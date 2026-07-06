# Orbital Mission Control — a guided tour

A two-minute tour of what you're looking at, what each part proves about
Yoltra, and how to drive the embedded DevTools panel (including time-travel).

> New here? Start with the [README](./README.md) to build and run it, then come
> back for this walkthrough.

---

## The screen at a glance

```
┌───────────────────────────────┬──────────────────────────────┐
│  MISSION PANE (your app)      │  DEVTOOLS PANEL (the panel)  │
│                               │                              │
│  • Mission header + stats     │  Inspector · State ·         │
│  • Telemetry pause control    │  Time Travel · Metrics       │
│  • Satellite cards (6)        │                              │
│    – live gauges              │  the exact browser-extension │
│    – per-card render counter  │  UI, over an in-memory hub   │
│    – Boost/Deploy/Transmit    │                              │
└───────────────────────────────┴──────────────────────────────┘
```

The left is a normal Yoltra app. The right is the **real** DevTools panel
(`@yoltra/devtools-storeview`) talking to the same store over an in-memory
loopback — no extension, no hub server, no install.

---

## 60-second tour

1. **Watch the cards settle.** Telemetry streams in every ~0.9s. Each satellite
   card has a **render counter** — when one satellite's battery ticks, only
   *that* card's counter increments. That's fine-grained reactivity: no
   selectors, no `memo`.
2. **Open the Inspector** (right panel, first tab). Events scroll in live. Click
   any row to see exactly which **state leaf paths** it changed.
3. **Press Boost on a low satellite.** It's rejected by middleware — the event
   shows up **vetoed** (red) in the timeline with *no* state change, and the
   mission raises an alert.
4. **Pause telemetry, then Time Travel.** Rewind the mission and watch the
   reconstructed state; then resume live.

---

## What each Yoltra feature looks like

| Feature | Where to look |
|---|---|
| **Fine-grained reactivity** | Each card's **render counter** — only the changed satellite re-renders. |
| **Typed path accessors** | Cards read `useAtomicProp("fleet", p => p.satellites[i].battery)` — fully typed, return type inferred. |
| **Wildcard subscriptions** | Header's *Fleet battery* recomputes from `satellites.**` (any battery leaf). |
| **Multiple slices** | `fleet` (telemetry + commands) and `mission` (clock + alerts). |
| **Event-sourcing** | The Inspector timeline *is* the event log; every row is one `channel.type` event. |
| **Effects (async)** | *Deploy* / *Transmit* / *Boost* commit instantly, then finish a moment later via effects. |
| **Middleware veto** | *Boost* under 20% battery is rejected — appears **vetoed** in the timeline, raises an alert. |
| **Time-travel** | The Time Travel tab rewinds the store to any recorded event. |

---

## Reading the DevTools panel

### Inspector — the event stream

- **Left:** a live, filterable timeline. Each row is one event:
  a status dot (**green = committed**, **red = vetoed by middleware**),
  the `channel.type`, a **Δ badge** (how many state leaf paths it changed),
  and the time.
- **Right (click a row):** the detail. This is Yoltra's story in one place —
  the exact **changed leaf paths** (e.g. `fleet.satellites.2.battery`) with
  their new values, plus the triggering **payload**. Vetoed events show
  "no state change".
- **`+ Emit`:** dispatch an ad-hoc event to the store by hand.

### State — the live snapshot

The current store state as a searchable tree, kept up to date by applying each
event's patches. Type in the search box to filter keys/values; **Refresh**
re-fetches a full snapshot.

### Time Travel — replay history

A scrubber over the recorded events plus a **reconstructed state preview** at
the selected point. See the workflow below.

### Metrics — throughput + architecture

- **Live:** events/sec, total events, avg processing time, queue depth, dedup
  hits, middleware rejections.
- **Architecture:** counts of reducers / effects / middleware / subscribers /
  connectors.
- **Consumers:** the actual registered reducers, effects, middleware, and the
  live **atomic subscriptions** (`reducer.property`) — the fine-grained wiring.

---

## Time-travel, step by step

Time-travel rewinds a **live** store, so the trick is to hold the timeline
still while you scrub.

1. **Pause telemetry.** In the mission pane, click **❚❚ Pause telemetry**. The
   status flips to **❚❚ PAUSED** and the event log stops growing. (You can skip
   this, but with telemetry live the store keeps advancing under you.)
2. **Open the Time Travel tab** in the panel.
3. **Scrub or step.** Drag the slider, or use **‹ Back** / **Forward ›**. The
   preview shows the store's state reconstructed at that point. Back walks one
   event earlier; Forward walks one later and disables at the live edge.
4. **Resume live.** Click **Resume Live** to snap the store back to the latest
   state, then **▶ Resume telemetry** to let the mission continue.

> Why pause? The mission clock emits every ~0.9s. While it runs, the panel's
> preview stays correct, but the store (and the satellite cards) keep moving —
> pausing makes the whole demo hold still so time-travel is easy to follow.

---

## Try this

- **See a veto:** let a satellite drain below 20%, then press **Boost**. Watch
  the Inspector row turn red (vetoed) with no Δ, and the header alert count rise.
- **See fine-grained updates:** press **Transmit** on one card and watch only
  that card's render counter move; the others stay put.
- **Trace a change:** click a `telemetry.drain` row in the Inspector and read
  the changed path — it points at exactly one satellite's `battery` leaf.
- **Rewind a command:** pause telemetry, Boost/Deploy a few times, then step
  Back through those events and watch the reconstructed state.

---

## Under the hood

The store agent, the hub, and the panel all run in the page over an in-memory
loopback transport — both ends speak the real DevTools protocol:

```ts
import { createLoopbackHub } from "@yoltra/devtools-ui";

const loopback = createLoopbackHub();
withDevtools(store, { port: 0, socketFactory: loopback.agentSocketFactory }); // agent
<DevtoolsApp config={{ port: 0, WebSocket: loopback.WebSocket }} />;          // panel
```

Swap `socketFactory` / `WebSocket` back out and the same app talks to the real
hub + browser extension, unchanged.
