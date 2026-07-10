# store-instrumentation

Covers the B1 instrumentation seam — the typed API DevTools agents consume
instead of reaching into store internals:

- `store.instrument(observer)` delivers one `InstrumentedEvent` per emit
  (committed or vetoed) with the exact slice-prefixed changed leaf paths, their
  old/new values, and the synchronous reduce time — so agents build precise
  patches without re-diffing state.
- Unsubscribing stops deliveries.
- `__devtoolsIntrospect()` exposes `dedupHits` and `queueDepth`.
- `__applyExternalState()` (time-travel) is public and typed.
