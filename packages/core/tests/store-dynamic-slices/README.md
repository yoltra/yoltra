# Store Dynamic Slices Suite

## Purpose

This suite focuses on dynamic reducer management:

- `registerReducer`
- `replaceReducers`
- Interaction with slice state preservation and deletion.

It validates that:

- New slices can be added at runtime and receive events.
- Disposers from `registerReducer` clean up reducer bus listeners and delete slice state.
- `replaceReducers` updates existing slices while preserving state when requested.
- `replaceReducers` removes obsolete slices and re-initialises DevTools.

## Components Covered

- `registerReducer`
- `replaceReducers`
- `hotReplace` (via a basic smoke test)

## Notes for Maintainers

If you alter how slices are mounted/unmounted (`mountSlice` / `unmountSlice`),
or change the semantics of `preserveState`, update this suite accordingly.
