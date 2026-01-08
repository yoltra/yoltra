# Loose Event Bus Pattern Suite

## Purpose

This suite exercises the flexible `LooseEventBus` from `src/eventBus/LooseEventBus.ts`,
focusing on:

- Exact vs pattern subscriptions (`*` and `**`).
- Normalisation of type keys (leading dots).
- Pattern matching semantics over dot-separated paths.
- De-duplication when the same handler is registered multiple times.
- Proper removal of handlers via the unsubscribe function and via `off`.
- Error isolation and `clear()` behaviour.

## Components Covered

- `LooseEventBus<C, T, P>`
  - `on`
  - `off`
  - `emit`
  - `clear`
  - internal helpers: `isPattern`, `normalizeTypeKey`, `splitPath`, `matchPattern`

## Notes for Maintainers

This suite acts as executable documentation for the pattern semantics:

- `*` matches exactly one segment.
- `**` matches zero or more segments, including empty.
- Patterns operate on **normalised** paths (leading dots are ignored).
- Exact subscriptions are stored under normalised type keys, but callers can freely include or omit a leading dot.

If you change `matchPattern` or normalisation logic, update these tests to reflect the new contract.
