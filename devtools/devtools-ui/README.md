![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/devtools-ui

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; | 👉 🇺🇸 English Version &nbsp;

[![npm version](https://img.shields.io/npm/v/@yoltra/devtools-ui)](https://www.npmjs.com/package/@yoltra/devtools-ui)
[![npm downloads](https://img.shields.io/npm/dm/@yoltra/devtools-ui)](https://www.npmjs.com/package/@yoltra/devtools-ui)
[![types](https://img.shields.io/npm/types/@yoltra/devtools-ui)](https://www.npmjs.com/package/@yoltra/devtools-ui)
[![License](https://img.shields.io/npm/l/@yoltra/devtools-ui)](https://github.com/yoltra/yoltra/blob/main/LICENSE)

**Shared React hooks and business logic for Yoltra DevTools UIs.**

`@yoltra/devtools-ui` is a headless logic layer that provides React hooks for connecting to the
Yoltra DevTools hub, tracking store state, browsing events, and controlling time travel. It
contains **no UI components**: rendering is handled by packages like
`@yoltra/devtools-storeview` (React DOM) and `@yoltra/devtools-cli` (Ink).

> **Full documentation:** [@yoltra/devtools-ui on yoltra.dev](https://yoltra.dev/en/yoltra/packages/devtools-ui/)

## Installation

```bash
npm install @yoltra/devtools-ui
```

**Peer dependency:** `react` ^18

## Quick Start

Wrap your DevTools UI in a `HubProvider` and use the hooks:

```tsx
function App() {
  return (
    <HubProvider config={{ port: 9800, extensionName: "My Panel" }}>
      <Dashboard />
    </HubProvider>
  );
}
```

Inside it, `useHubConnection()` gives the connection `status`, `useStoreRegistry()` the connected
stores, and `useEventLog(storeId)` and `useStoreState(storeId)` the events and live state of one.

## Hooks

- **Connection and registry:** `useHubConnection()` (`status`, `send`, `subscribe`,
  `disconnect`, `reconnect`) and `useStoreRegistry()`.
- **Data:** `useEventLog`, `useStoreState`, `useStoreSubscriptions` and `useStoreMetrics`, each
  taking a `storeId`.
- **Actions:** `useTimeTravel(storeId, entries)`, `useEventReplay(storeId)` and
  `useEventEmitter(storeId)`.

## Context

`HubProvider` wraps its children in one hub connection. Its `HubConnectionConfig` takes `port`,
`host` (`"localhost"`), `extensionName`, `autoReconnect` (`true`), `maxReconnectAttempts`
(`Infinity`) and `authToken`, the hub's token when it was started with one.

## How It Works

`HubProvider` owns the one socket and hands every hook the same `send` and `subscribe` through
`HubContext`. Data hooks filter incoming frames by `storeId`, and action hooks only send commands;
nothing is buffered on the panel side. The hub can be a real one or `createLoopbackHub()`, which
speaks the same protocol inside the page. See the
[diagram](https://yoltra.dev/en/yoltra/packages/devtools-ui/#how-it-works).

```mermaid
flowchart TD
    accTitle: How devtools-ui connects
    accDescr: HubProvider handshakes with the hub and reconnects with backoff, and each hook subscribes to the messages it needs and sends the commands a view asks for
    hub(["a hub, or createLoopbackHub() in the same page"])
    view(["a React UI: storeview, the CLI or your own panel"])

    subgraph ui ["@yoltra/devtools-ui"]
    direction TB
        provider["HubProvider<br/>config.WebSocket or the global WebSocket"]
        provider -->|"onopen"| hs["HANDSHAKE_REQUEST<br/>role EXTENSION, every capability on"]
        hs --> ok{"HANDSHAKE_RESPONSE success?"}
        ok -->|"no"| closeIt["close the socket"]
        closeIt --> retry["reconnect with backoff<br/>750 ms doubled plus jitter, capped at 30 s"]
        retry --> provider
        ok -->|"yes"| ctx["HubContext<br/>status, send, subscribe"]

        ctx -->|"subscribe"| registry["useStoreRegistry<br/>STORE_REGISTRY, STORE_CONNECTED,<br/>STORE_DISCONNECTED"]
        ctx -->|"subscribe"| log["useEventLog<br/>STORE_EVENT kept per store, last 2000"]
        ctx -->|"subscribe and send"| stateHook["useStoreState<br/>REQUEST_STATE every 1.5 s until a snapshot,<br/>then applyPatches per committed STORE_EVENT"]
        ctx -->|"subscribe and send"| metricsHook["useStoreMetrics<br/>REQUEST_METRICS every 2 s"]
        ctx -->|"subscribe and send"| subsHook["useStoreSubscriptions<br/>REQUEST_SUBSCRIPTIONS"]
        log -->|"entries"| travel["useTimeTravel<br/>replayState from the first STATE_SNAPSHOT"]
        travel -->|"TIME_TRAVEL"| ctx
        replayHook["useEventReplay"] -->|"EVENT_REPLAY"| ctx
        emitHook["useEventEmitter"] -->|"EMIT_TO_STORE"| ctx
    end

    hub <-->|"protocol frames"| provider
    registry --> view
    log --> view
    stateHook --> view
    metricsHook --> view
    subsHook --> view
    travel --> view
    view -->|"user actions"| replayHook
    view -->|"user actions"| emitHook
```

## State Synchronization

`useStoreState` requests a full `STATE_SNAPSHOT` on mount, buffers `STORE_EVENT` patches that
arrive before it, then applies every patch incrementally with `applyPatches`, so the UI reflects
the latest state without repeated full snapshots.

## Time Travel

`useTimeTravel` returns `currentIndex`, `isTimeTraveling`, `jumpTo`, `stepBack`, `stepForward`
and `resume`. The panel rebuilds the target state itself, replaying patches forward from the first
snapshot it saw, and sends that whole state. Both the agent and the store refuse unless replay was
enabled. The package page has the
[sequence of one jump](https://yoltra.dev/en/yoltra/packages/devtools-ui/#time-travel).

## API Reference

`HubProvider`, `HubContext`, the hooks above, `applyPatches(state, patches)`, and the types
`HubConnectionConfig`, `HubConnectionStatus`, `HubContextValue`, `RegisteredStore` and
`EventLogEntry`: see the [API reference](https://yoltra.dev/en/yoltra/api/devtools-ui/).

## Related Packages

- **[@yoltra/devtools-protocol](../devtools-protocol/README.md)**: wire format consumed by these hooks
- **[@yoltra/devtools-storeview](../devtools-storeview/README.md)**: React DOM UI built on these hooks
- **[@yoltra/devtools-server](../devtools-server/README.md)**: the hub these hooks connect to

## License

**MIT**. Free to use in commercial and open-source projects.

> **Full documentation:** [@yoltra/devtools-ui on yoltra.dev](https://yoltra.dev/en/yoltra/packages/devtools-ui/)
