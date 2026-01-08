# Store Static Helpers Suite

## Purpose

This suite covers small but important helpers around the store:

- `Store.buildAncestorPaths`
- `typedEvents`
- `typedActions` (deprecated alias)

These helpers are used by consumers to build correctly-typed event key lists and to
reason about dotted property paths.

## Components Covered

- `Store.buildAncestorPaths(path)`
- `typedEvents<EM>(marker)(channel, events)`
- `typedActions` (alias of `typedEvents`)

## Notes for Maintainers

These tests focus on runtime behaviour. Type-level contracts are enforced by TypeScript
at compile time and are not asserted here.

If you change path normalisation or the runtime shape of the helpers, update this suite
to match the intended behaviour.
