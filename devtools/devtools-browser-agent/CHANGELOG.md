# Change Log - @yoltra/devtools-browser-agent

This log was last generated on Sat, 15 Aug 2026 22:14:53 GMT and should not be manually modified.

## 0.5.0
Sat, 15 Aug 2026 22:14:53 GMT

### Updates

- Names build outputs `.mjs` and `.cjs` instead of `.esm.js` and `.cjs.js`, and adds explicit extensions to the relative specifiers of published declaration files.\n\nNode infers a `.js` file's format from the nearest package.json `type` field, so the `require` condition resolved to a file parsed as ESM and threw `ReferenceError: exports is not defined in ES module scope` on a CommonJS consumer's first line. The declarations had the mirror problem: extensionless relative re-exports do not resolve under `moduleResolution: nodenext`, and because nearly every project sets `skipLibCheck: true` the errors were suppressed while every re-exported symbol silently degraded to `any` — a green build with no completions and no type checking, which is worse than a hard failure because nothing about it looks like one.

## 0.4.0
Fri, 07 Aug 2026 13:15:02 GMT

### Minor changes

- Accepts an authToken, forwarded to the hub on every handshake, so a hub started with a token can be used on a shared or containerised host where any local process could otherwise connect as a panel.
- State snapshots are bounded before they are sent, with a maxSnapshotBytes option defaulting to 6 MiB — under the hub's 8 MiB frame cap, since the snapshot travels inside an envelope and a frame that overshoots by a few hundred bytes is refused exactly like one that overshoots by a megabyte. An oversized frame was not a loud failure: the hub refused it and dropped the connection, so the client reconnected, asked again, was refused again, and the panel waited through the loop with nothing on screen to explain it. A shortened snapshot now says so rather than presenting a partial tree as the state.
- Adds a postMessage transport so a page can be inspected without a hub process. Attaching a browser panel required running a server, editing the application, and setting a capability flag — three steps against Redux DevTools' one, at the moment somebody is deciding whether the tool is worth the trouble. The agent now picks its transport: when an extension's content script has announced that it is relaying the page, protocol frames travel over postMessage; otherwise it opens a WebSocket to the hub as before, which is still the only way into a Node process or a remote session. A transport option forces either, and an explicitly injected socketFactory always wins, so the embedded loopback panel and the tests are unaffected. The socket reports itself open immediately because postMessage has no connection to establish; when nothing is relaying, the handshake simply goes unanswered and frames buffer exactly as they do against a hub that is not running, which keeps one failure mode to explain rather than two.
- Expose the state codec's sanitize hook through withDevtools. State and event payloads frequently hold tokens, session material and personal data, and everything the agent forwards crosses a socket to another process — until now, unredacted. The hook is applied to every value the agent encodes: state snapshots, time-travel snapshots, event payloads and state patches. Patch values get the op's own path prefixed onto the codec's, because a leaf patch encodes a bare scalar whose internal path is empty — without the prefix, a recipe keyed on key names would redact the snapshot and the payload while the same secret slipped through in the patch. Redaction happens at the wire; the live store keeps its real values.

### Patches

- State, event payloads and patch values now cross the wire through the protocol codec instead of JSON.stringify. Two failures went with it. A Map in application state reached the panel as {} and time-travel sent that {} back and applied it to the running store, so a debugging tool silently emptied a live collection inside the program it was inspecting. And a BigInt or a cycle threw from inside a message handler nothing awaits, so no snapshot ever arrived and the panel retried every 1.5 seconds forever. Inbound time-travel state is decoded before it reaches the store, closing the round trip.
- A command handler that throws is now caught and reported instead of becoming an unhandled rejection. The message callback is async and nothing awaits it, so a failure inside it surfaced far from its cause or nowhere at all, while the panel sat waiting for a reply that never came.
- Imports the state codec from `@yoltra/core`, where it now lives, rather than from the protocol package.

## 0.3.0
Sun, 12 Jul 2026 00:20:57 GMT

_Version update only_

## 0.2.0
Fri, 10 Jul 2026 07:51:29 GMT

### Minor changes

- Initial release: browser agent that relays a store to the hub through the typed instrument seam over an injected WebSocket, keeping node-only transports out of the browser bundle. Devtools time-travel is gated behind the store allowReplay capability.
- withDevtools now accepts an optional socketFactory in its config, so the agent can connect to the hub over a custom transport (for example an in-memory loopback used by an embedded panel or a test) instead of always opening a native browser WebSocket. Defaults to the native WebSocket factory.

### Patches

- withDevtools now tears down its instrumentation observer and WebSocket connection when the store is disposed, and re-wrapping a store (HMR, remount, a double call) first tears down the previous attachment. Previously it leaked observers and reconnecting sockets and double-sent every event.
- The agent now validates each incoming hub message (a plain object with a string type) before acting on it, and warns on unknown message types instead of silently ignoring them. This guards EMIT_TO_STORE, which forwards straight into store.emit.
- The state version (snapshotVersion) now advances only on committed events, which carry patches; a vetoed event is logged with committed:false and does not bump it. This keeps time-travel state reconstruction correlated. Wire ordering is preserved by the event log's insertion order.

