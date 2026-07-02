![Yoltra logo](../../assets/logo.svg)

# @yoltra/devtools-node-agent

> [ 🇲🇽 Versión en Español](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/README.es.md)&nbsp;
> |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/README.pt.md)&nbsp;
> | &nbsp; 👉
> [ 🇺🇸 English Version](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/README.md)&nbsp;
> |
> &nbsp;[ 🇫🇷 Version française](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-node-agent/README.fr.md)

**Node.js DevTools agent — connect a Yoltra store to the DevTools hub from a Node.js process.**

`@yoltra/devtools-node-agent` transparently instruments a Yoltra store so every event, state
change, and metric is forwarded to the DevTools hub in real time. Uses the `ws` package for
WebSocket connectivity with automatic reconnection.

---

## Installation

```bash
npm install @yoltra/devtools-node-agent
```

**Peer dependency:** `@yoltra/core`

---

## Quick Start

```typescript
import { createStore } from "@yoltra/core";
import { withNodetools } from "@yoltra/devtools-node-agent";

const store = createStore({
  name: "MyServer",
  reducer: {
    counter: {
      state: { value: 0 },
      when: { any: true },
      reducer: (state, event) =>
        event.type === "increment" ? { value: state.value + 1 } : state,
    },
  },
});

// Instrument the store — connects to hub on ws://localhost:9800
withNodetools(store, { port: 9800 });

// Use the store as normal — events are automatically forwarded
await store.emit("counter", "increment", null);
```

---

## How It Works

1. **Registers a `when: { any: true }` effect** on the store to intercept every event
2. **Computes JSON Patch diffs** between previous and next state using `computePatches`
3. **Sends `STORE_EVENT` messages** with patches to the hub
4. **Handles incoming commands** from extensions:
   - `REQUEST_STATE` → responds with full `STATE_SNAPSHOT`
   - `REQUEST_METRICS` → responds with `STORE_METRICS`
   - `REQUEST_SUBSCRIPTIONS` → responds with reducer/effect inventory
   - `TIME_TRAVEL` → calls `__applyExternalState()` on the store
   - `EVENT_REPLAY` → calls `__replayEvents()` on the store
   - `EMIT_TO_STORE` → calls `store.emit()` with the provided event

The wrapper is **transparent** — it returns the same store instance. No API changes required.

---

## Configuration

```typescript
interface DevtoolsWrapperConfig {
  /** Hub server port. Required. */
  port: number;
  /** Hub server host. @default "localhost" */
  host?: string;
  /** Persisted store ID (survives reconnects). @default crypto.randomUUID() */
  storeId?: string;
  /** Enable time-travel and event replay. @default false */
  allowReplay?: boolean;
  /** Allow extensions to emit events to this store. @default false */
  allowEmit?: boolean;
  /** Sampling configuration (v1 design, implementation deferred). */
  sampling?: SamplingConfig;
  /** Auto-reconnect on disconnect. @default true */
  autoReconnect?: boolean;
  /** Max reconnection attempts. @default Infinity */
  maxReconnectAttempts?: number;
  /** Base delay for exponential backoff (ms). @default 1000 */
  baseDelay?: number;
  /** Max delay cap for backoff (ms). @default 30000 */
  maxDelay?: number;
}
```

### Enabling Time Travel

```typescript
withNodetools(store, {
  port: 9800,
  allowReplay: true,
  allowEmit: true,
});
```

When `allowReplay` is `true`, the store advertises `replay` capability and responds to
`TIME_TRAVEL` and `EVENT_REPLAY` commands from extensions.

---

## API Reference

| Export                         | Description                               |
| ------------------------------ | ----------------------------------------- |
| `withNodetools(store, config)` | Instrument a store and connect to the hub |
| `DevtoolsWrapperConfig`        | Configuration type                        |

---

## Related Packages

- **[@yoltra/devtools-protocol](../devtools-protocol/README.md)** — Wire format and message
  types
- **[@yoltra/devtools-server](../devtools-server/README.md)** — The hub this agent connects to
- **[@yoltra/devtools-browser-agent](../devtools-browser-agent/README.md)** — Browser equivalent
  of this package
- **[@yoltra/core](../../packages/core/README.md)** — The store being instrumented

---

## License

**MIT** — Free to use in commercial and open-source projects.
