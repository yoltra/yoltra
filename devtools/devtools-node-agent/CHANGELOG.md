# Change Log - @yoltra/devtools-node-agent

This log was last generated on Fri, 10 Jul 2026 07:51:29 GMT and should not be manually modified.

## 0.2.0
Fri, 10 Jul 2026 07:51:29 GMT

### Minor changes

- Initial release: node agent that relays a store to the hub over a ws WebSocket. Devtools time-travel is gated behind the store allowReplay capability.

### Patches

- withNodetools now tears down its instrumentation observer and WebSocket connection when the store is disposed, and re-wrapping a store first tears down the previous attachment. Previously it leaked observers and reconnecting sockets and double-sent every event.
- The agent now validates each incoming hub message (a plain object with a string type) before acting on it, and warns on unknown message types instead of silently ignoring them. This guards EMIT_TO_STORE, which forwards straight into store.emit.
- The state version (snapshotVersion) now advances only on committed events, which carry patches; a vetoed event is logged with committed:false and does not bump it. This keeps time-travel state reconstruction correlated. Wire ordering is preserved by the event log's insertion order.

