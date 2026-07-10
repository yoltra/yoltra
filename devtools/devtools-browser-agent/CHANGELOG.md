# Change Log - @yoltra/devtools-browser-agent

This log was last generated on Fri, 10 Jul 2026 07:51:29 GMT and should not be manually modified.

## 0.2.0
Fri, 10 Jul 2026 07:51:29 GMT

### Minor changes

- Initial release: browser agent that relays a store to the hub through the typed instrument seam over an injected WebSocket, keeping node-only transports out of the browser bundle. Devtools time-travel is gated behind the store allowReplay capability.
- withDevtools now accepts an optional socketFactory in its config, so the agent can connect to the hub over a custom transport (for example an in-memory loopback used by an embedded panel or a test) instead of always opening a native browser WebSocket. Defaults to the native WebSocket factory.

### Patches

- withDevtools now tears down its instrumentation observer and WebSocket connection when the store is disposed, and re-wrapping a store (HMR, remount, a double call) first tears down the previous attachment. Previously it leaked observers and reconnecting sockets and double-sent every event.
- The agent now validates each incoming hub message (a plain object with a string type) before acting on it, and warns on unknown message types instead of silently ignoring them. This guards EMIT_TO_STORE, which forwards straight into store.emit.
- The state version (snapshotVersion) now advances only on committed events, which carry patches; a vetoed event is logged with committed:false and does not bump it. This keeps time-travel state reconstruction correlated. Wire ordering is preserved by the event log's insertion order.

