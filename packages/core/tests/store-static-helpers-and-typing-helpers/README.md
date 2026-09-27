# Store Static Helpers Suite

## Purpose

This suite covers small but important helpers around the store:

- `Store.buildAncestorPaths`
- `typedEvents`
- `typedActions` (deprecated alias)
- `defineSlice` / `defineMiddleware` / `defineEffect`

These helpers are used by consumers to build correctly-typed event key lists and to
reason about dotted property paths.

## Components Covered

- `Store.buildAncestorPaths(path)`
- `typedEvents<EM>(marker)(channel, events)`
- `typedActions` (alias of `typedEvents`)
- `defineSlice<EMAdd>()(spec)`, `defineMiddleware<EMAdd>()(spec)`, `defineEffect<EMAdd>()(spec)`

## Notes for Maintainers

These tests focus on runtime behaviour. Type-level contracts are enforced by TypeScript
at compile time and are not asserted here.

The spec builders exist purely for the type they return, so what runtime tests can say
about them is narrow but worth pinning: they are identity, and they add **no** property.
The event-map brand they carry is a phantom, and if it ever became a real property it
would surface in `Object.keys`, in a devtools snapshot, and in anything that serializes a
spec. The type-level half lives in `tests/store-types/store-extend.test-d.ts`.

If you change path normalisation or the runtime shape of the helpers, update this suite
to match the intended behaviour.
