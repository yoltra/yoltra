# Change Log - @yoltra/devtools-server

This log was last generated on Fri, 07 Aug 2026 13:15:02 GMT and should not be manually modified.

## 0.4.0
Fri, 07 Aug 2026 13:15:02 GMT

### Minor changes

- Adds an optional authToken the hub requires from every client's handshake, compared in constant time and checked before the client is registered or replayed any history. Binding to loopback keeps the network out, but loopback is not an authentication boundary: every other process on the machine can reach the hub, so without a token anything running locally could connect as a panel and read the application's entire state, inject events, and overwrite state through time-travel — a package install script, or another tenant on a shared CI runner. The token stays unset by default, because requiring one would break the zero-configuration local flow the tool exists for; instead the hub now says once at startup that it is running open and what that means, so the exposure is stated rather than presented as a secure default.
- Adds allowedExtensionIds, narrowing which browser extensions may open a socket. Extension origins all share one scheme, so permitting the scheme permitted every extension the user has installed — any of which, from a devtools page of its own, could connect and read whatever the attached stores hold. Naming ids restricts that to the panel actually meant to connect. Left empty by default because there is no id to assume: an unpacked build and a store install have different ones, so a hardcoded default would lock out a developer running the extension they had just built. Meant to be set alongside authToken, since an origin check constrains which page opened the socket and says nothing about which process did.
- History replayed to a newly-connected panel now skips events from stores that have since disconnected: a long-lived hub greeted every new panel with a burst of frames for stores it cannot select, sent one at a time, ahead of anything useful. Metrics are fanned out only to extensions that declared they display them — the capability flags were advertised and then ignored, so every extension received every message whether or not it had anywhere to put it. The remaining flags describe what an extension can render rather than what traffic it wants, and are documented as such instead of implying a filter that never existed.
- Adds a per-connection message allowance, defaulting to 200 per second. A command like REQUEST_STATE costs the store a full serialization and the hub a fan-out, so a client looping on it turned one cheap socket write into repeated work across every connected process. The excess is dropped rather than the socket closed: severing would punish a brief burst exactly like a flood, and a panel that overshoots recovers on the next window.

### Updates

- Coverage is now measured and gated. No package in the devtools suite had a threshold of any kind, so nothing stopped coverage falling; the tooling to measure it was not installed either. Thresholds are set at what is actually met so a regression fails the build, with type declarations and entry points excluded because counting files that compile to nothing measures how much of a package is types rather than how much of its logic is tested. Modules that are genuinely under-tested are left in the numbers rather than excluded — hiding one makes the figure look better and the package no safer.

## 0.3.0
Sun, 12 Jul 2026 00:20:57 GMT

_Version update only_

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

