# Store Basic Flow Suite

## Purpose

This suite exercises the main store data flow using `createStore` and realistic
reducers.

It covers:

- Initial state wiring and deep freezing.
- Event emission through reducers.
- Shallow immutability of the root state.
- Fine-grained connectors via `connect` + dotted paths (exact and with wildcards).
- Coarse `subscribe` listeners firing only on real changes.
- No-op behaviour when reducers return the same state reference.

## Components Covered

- `createStore`
- `Store<EM, R, S>` constructor
- `emit`
- `getState`
- `connect`
- `subscribe`
- Integration of:
  - `EventBus`
  - `LooseEventBus`
  - `detectChangedProps`
  - `freezeState`

## Notes for Maintainers

This suite is intended as a canonical example of how to:

- Model slices and events.
- Wire reducers into a store.
- Observe the state both coarsely and at fine-grained paths.

If you change how `forwardEvent`, `getAtPath`, or connector events work, update these tests
to represent the new semantics.
