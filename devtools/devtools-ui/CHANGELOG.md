# Change Log - @yoltra/devtools-ui

This log was last generated on Sun, 12 Jul 2026 00:20:57 GMT and should not be manually modified.

## 0.3.0
Sun, 12 Jul 2026 00:20:57 GMT

_Version update only_

## 0.2.0
Fri, 10 Jul 2026 07:51:29 GMT

### Minor changes

- Initial release: devtools UI hooks and RFC-6902 patch application. Patch application ignores __proto__, constructor, and prototype pointer segments to prevent prototype pollution.
- useTimeTravel now accepts a canReplay argument and gates its TIME_TRAVEL sends (jumpTo, resume) on it, so the panel does not send time-travel commands to a store that did not advertise the replay capability (the agent and core enforce this too). Defaults to true for backward compatibility.
- Adds createLoopbackHub(), an in-memory DevTools hub plus the two client transports that connect to it: a socketFactory for the store agent and a WebSocket-compatible class for the panel UI. It speaks the real protocol (handshake, store-to-extension fan-out, command routing by storeId) with no server, ports, or extension, so the agent, hub, and panel can run in a single process (a browser tab or a test).
- useStoreState now re-sends REQUEST_STATE on an interval until the first STATE_SNAPSHOT arrives, so the State and time-travel views no longer hang when the initial request races store registration or the handshake. useTimeTravel exposes previewState (the state reconstructed at the viewed history position) and gains robust stepping: Forward now advances (and resyncs to live at the end) instead of no-opping, and the timeline frame is frozen at travel-start so a store that keeps emitting cannot shift the scrubber under the user and make a fixed position appear to drift backward. It also exposes frameCount for sizing the scrubber.

### Patches

- applyPatches now implements RFC 6902 add semantics for arrays: an add op inserts before the target index (shifting) or appends for the - end-of-array token, instead of overwriting the element like replace. This keeps array indices correct for a future or hostile array-add patch.

