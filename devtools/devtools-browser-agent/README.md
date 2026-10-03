![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/devtools-browser-agent

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp;
> | 👉
> [ 🇺🇸 English Version](./README.md)&nbsp;

[![npm version](https://img.shields.io/npm/v/@yoltra/devtools-browser-agent)](https://www.npmjs.com/package/@yoltra/devtools-browser-agent)
[![npm downloads](https://img.shields.io/npm/dm/@yoltra/devtools-browser-agent)](https://www.npmjs.com/package/@yoltra/devtools-browser-agent)
[![types](https://img.shields.io/npm/types/@yoltra/devtools-browser-agent)](https://www.npmjs.com/package/@yoltra/devtools-browser-agent)
[![License](https://img.shields.io/npm/l/@yoltra/devtools-browser-agent)](https://github.com/yoltra/yoltra/blob/main/LICENSE)

**Browser DevTools agent: connect a Yoltra store to the DevTools hub from the browser.**

`@yoltra/devtools-browser-agent` transparently instruments a Yoltra store so every event, state
change, and metric is forwarded to the DevTools hub in real time. Uses the native browser
`WebSocket` API (no extra dependency) with automatic reconnection and message buffering.

> **Full documentation:** [@yoltra/devtools-browser-agent on yoltra.dev](https://yoltra.dev/en/yoltra/packages/devtools-browser-agent/)

## Installation

```bash
npm install @yoltra/devtools-browser-agent
```

**Peer dependency:** `@yoltra/core`

## Quick Start

```typescript
import { withDevtools } from "@yoltra/devtools-browser-agent";

// Instrument the store: connects to hub on ws://localhost:9800
withDevtools(store, { port: 9800 });

// Use the store as normal: events are automatically forwarded
await store.emit("todos", "add", { title: "Buy milk" });
```

## How It Works

The agent attaches to the store's typed instrumentation seam, `store.instrument(observer)`, maps
each event's changed paths to RFC-6902 patches and sends them as `STORE_EVENT` messages, with
`reason` and `vetoedBy` for an event that did not commit. It buffers up to 100 messages while
disconnected and answers `REQUEST_STATE`, `REQUEST_METRICS`, `REQUEST_SUBSCRIPTIONS`,
`TIME_TRAVEL`, `EVENT_REPLAY` and `EMIT_TO_STORE`. Events on `ephemeral` channels are not
reported, and the wrapper is **transparent**: it returns the same store instance.

The transport is a custom `socketFactory`, the extension's `postMessage` bridge, or a native
`WebSocket`. Payloads are sampled, bounded by `maxEventBytes` and `maxSnapshotBytes` and run
through `sanitize`. Time-travel is gated twice: the agent needs `allowReplay`, and the store
must be created with `createStore({ devtools: { allowReplay: true } })`.

## Configuration

`withDevtools(store, config)` takes a `DevtoolsWrapperConfig`: `port` (required), `host`
(`"localhost"`), `storeId` (`store.name`), `allowReplay` and `allowEmit` (both `false`),
`autoReconnect` (`true`), `maxReconnectAttempts`, `baseDelay` and `maxDelay`.

```typescript
withDevtools(store, {
  port: 9800,
  storeId: "my-app-store",
  allowReplay: true,
  allowEmit: true,
  autoReconnect: true,
  maxReconnectAttempts: 20,
  baseDelay: 1000,
  maxDelay: 15000,
});
```

The hub accepts one connection per store id: give stores that share a `name` distinct `storeId`s.

## Reconnection

Exponential backoff with 10% jitter, from `baseDelay` (1 s) up to `maxDelay` (30 s). Messages
are buffered during a disconnect and flushed on reconnect.

## API Reference

`withDevtools(store, config)` and the `DevtoolsWrapperConfig` type, in the
[API reference](https://yoltra.dev/en/yoltra/api/devtools-browser-agent/). The package page
diagrams [how it works](https://yoltra.dev/en/yoltra/packages/devtools-browser-agent/#how-it-works).

```mermaid
flowchart TD
    accTitle: How the browser agent works
    accDescr: withDevtools picks a transport, reports instrumented events and metrics to the hub or the extension, and answers state, replay and emit commands when they are allowed
    app(["your app: withDevtools(store, config)"])
    store(["the @yoltra/core store"])

    subgraph agent ["withDevtools"]
    direction TB
        pick{"which transport?"}
        pick -->|"config.socketFactory"| custom["that factory<br/>for example createLoopbackHub"]
        pick -->|"transport bridge, or auto with<br/>__YOLTRA_DEVTOOLS_BRIDGE__ set"| pm["createPostMessageSocketFactory<br/>window.postMessage, yoltra-devtools-bridge"]
        pick -->|"transport websocket, or auto<br/>without the mark"| native["native WebSocket<br/>ws://host:port"]
        custom --> client
        pm --> client
        native --> client["DevtoolsWsClient<br/>ReconnectingWsClient: handshake,<br/>buffer of 100, backoff"]

        obs["instrument observer<br/>changed paths, prev and next values,<br/>reduceTimeMs, ephemeral channels excluded"]
        obs --> counters["metric counters<br/>attempted, committed, reduce time"]
        counters --> sample{"sampled out?<br/>ignore, then throttle, then skip"}
        sample -->|"yes"| skipped(["not sent, still counted"])
        sample -->|"no"| build["STORE_EVENT<br/>patchesFromChange, payload and patch values<br/>bounded by maxEventBytes, run through sanitize"]
        build -->|"a committed event bumps snapshotVersion"| client
        regs["onRegistrationChange<br/>skipped when every change is internal"] --> subs["STORE_SUBSCRIPTIONS<br/>from __devtoolsIntrospect"]
        subs --> client

        client -->|"incoming command"| cmd{"msg.type"}
        cmd -->|"REQUEST_STATE"| snap["encodeStateBounded<br/>maxSnapshotBytes, sanitize"]
        cmd -->|"REQUEST_METRICS"| met["__devtoolsIntrospect plus counters"]
        cmd -->|"REQUEST_SUBSCRIPTIONS"| subs
        cmd -->|"TIME_TRAVEL, if allowReplay"| tt["__applyExternalState(decodeState(state))<br/>then a fresh STATE_SNAPSHOT"]
        cmd -->|"EVENT_REPLAY, if allowReplay"| rep["__replayEvents"]
        cmd -->|"EMIT_TO_STORE, if allowEmit"| emitCmd["store.emit"]
        snap -->|"STATE_SNAPSHOT"| client
        met -->|"STORE_METRICS"| client
        tt -->|"STATE_SNAPSHOT"| client
    end

    app --> pick
    store -->|"every reduce"| obs
    store -->|"registrations change"| regs
    tt --> store
    rep --> store
    emitCmd --> store
    client <-->|"protocol frames"| far(["a hub, the extension bridge,<br/>or a loopback broker"])
```

## Related Packages

- **[@yoltra/devtools-protocol](../devtools-protocol/README.md)**: wire format and message types
- **[@yoltra/devtools-server](../devtools-server/README.md)**: the hub this agent connects to
- **[@yoltra/devtools-ext](../devtools-ext/README.md)**: browser extension that displays the UI
- **[@yoltra/core](../../packages/core/README.md)**: the store being instrumented

## License

**MIT**. Free to use in commercial and open-source projects.

> **Full documentation:** [@yoltra/devtools-browser-agent on yoltra.dev](https://yoltra.dev/en/yoltra/packages/devtools-browser-agent/)
