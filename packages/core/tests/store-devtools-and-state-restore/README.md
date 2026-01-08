# Store DevTools and State Restore Suite

## Purpose

This suite targets DevTools-related behaviour and external state application:

- Redux DevTools integration (when available in a browser-like environment).
- `__applyExternalState` via DevTools dispatch messages:
  - JUMP_TO_STATE / JUMP_TO_ACTION / ROLLBACK / RESET
  - IMPORT_STATE
  - COMMIT

It verifies that:

- DevTools `connect` is called when `window.__REDUX_DEVTOOLS_EXTENSION__` is present and `NODE_ENV !== 'production'`.
- Incoming DevTools messages are handled to replace the internal state.
- Fine-grained connector events are emitted when state is externally replaced.
- Coarse subscribers fire once after DevTools-applied state changes.

## Components Covered

- DevTools setup in `Store` constructor.
- DevTools `subscribe` callback behaviour.
- Indirect coverage of `__applyExternalState`.

## Notes for Maintainers

These tests intentionally stub a minimal DevTools extension on `window` and assert
that the integration behaves as expected. If you adjust DevTools wiring or the
message handling logic, update this suite accordingly.

The suite runs in a Node environment; `window` is provided via `globalThis`.
