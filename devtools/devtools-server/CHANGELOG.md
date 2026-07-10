# Change Log - @yoltra/devtools-server

This log was last generated on Fri, 10 Jul 2026 07:51:29 GMT and should not be manually modified.

## 0.2.0
Fri, 10 Jul 2026 07:51:29 GMT

### Minor changes

- Initial release: the devtools hub - connection router, ring-buffer history for late joiners, and role-based fan-out. WebSocket connections are origin-checked (loopback and browser-extension origins only) to prevent cross-site hijacking.

### Patches

- The hub now caps accepted WebSocket frames at 8 MiB (maxPayload). Oversized frames fan out to every extension and buffer into history, so an unbounded size was a local DoS / memory-amplification vector.
- The hub now validates incoming messages at ingress: a message must be a plain object with a string type discriminant before it reaches handshake or routing. Null, arrays, primitives, and type-less payloads are dropped.
- Replaced unguarded non-null assertions in the router and hub with explicit guards: a handshake whose role does not match its id payload is rejected, a STORE_CONNECTED broadcast is skipped when storeInfo is absent, and the registry omits connections that have not finished registering. These were runtime-crash paths (cannot read property of undefined).

### Updates

- Add unit tests for the hub RingBuffer (retention, overflow eviction, clear) and Router (registration, fan-out to open extensions, targeted store delivery, registry and lifecycle messages). Test-only; no runtime change.

