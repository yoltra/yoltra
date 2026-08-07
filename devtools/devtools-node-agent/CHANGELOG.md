# Change Log - @yoltra/devtools-node-agent

This log was last generated on Fri, 07 Aug 2026 13:15:02 GMT and should not be manually modified.

## 0.4.0
Fri, 07 Aug 2026 13:15:02 GMT

### Minor changes

- Accepts an authToken, forwarded to the hub on every handshake, so a hub started with a token can be used on a shared or containerised host where any local process could otherwise connect as a panel.
- State snapshots are bounded before they are sent, with a maxSnapshotBytes option defaulting to 6 MiB — under the hub's 8 MiB frame cap, since the snapshot travels inside an envelope and a frame that overshoots by a few hundred bytes is refused exactly like one that overshoots by a megabyte. An oversized frame was not a loud failure: the hub refused it and dropped the connection, so the client reconnected, asked again, was refused again, and the panel waited through the loop with nothing on screen to explain it. A shortened snapshot now says so rather than presenting a partial tree as the state.
- Expose the state codec's sanitize hook through withNodetools, mirroring the browser agent: applied to state snapshots, time-travel snapshots, event payloads and state patches, with the op's own path prefixed for patch values so a key-name recipe covers a leaf replacement. A Node service is exactly the case where the hub sits on another machine, which is why the suite asserts the contract over real sockets.

### Patches

- State, event payloads and patch values now cross the wire through the protocol codec instead of JSON.stringify. Two failures went with it. A Map in application state reached the panel as {} and time-travel sent that {} back and applied it to the running store, so a debugging tool silently emptied a live collection inside the program it was inspecting. And a BigInt or a cycle threw from inside a message handler nothing awaits, so no snapshot ever arrived and the panel retried every 1.5 seconds forever. Inbound time-travel state is decoded before it reaches the store, closing the round trip.
- Removes two recorder methods and the counters behind them. Nothing ever called them, and the figures they were meant to produce come from the store's own introspection — so they read as instrumentation that existed while measuring nothing.
- A command handler that throws is now caught and reported instead of becoming an unhandled rejection. The message callback is async and nothing awaits it, so a failure inside it surfaced far from its cause or nowhere at all, while the panel sat waiting for a reply that never came.
- Imports the state codec from `@yoltra/core`, where it now lives, rather than from the protocol package.

## 0.3.0
Sun, 12 Jul 2026 00:20:57 GMT

_Version update only_

## 0.2.0
Fri, 10 Jul 2026 07:51:29 GMT

### Minor changes

- Initial release: node agent that relays a store to the hub over a ws WebSocket. Devtools time-travel is gated behind the store allowReplay capability.

### Patches

- withNodetools now tears down its instrumentation observer and WebSocket connection when the store is disposed, and re-wrapping a store first tears down the previous attachment. Previously it leaked observers and reconnecting sockets and double-sent every event.
- The agent now validates each incoming hub message (a plain object with a string type) before acting on it, and warns on unknown message types instead of silently ignoring them. This guards EMIT_TO_STORE, which forwards straight into store.emit.
- The state version (snapshotVersion) now advances only on committed events, which carry patches; a vetoed event is logged with committed:false and does not bump it. This keeps time-travel state reconstruction correlated. Wire ordering is preserved by the event log's insertion order.

