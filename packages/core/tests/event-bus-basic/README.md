# Event Bus Basic Suite

## Purpose

This suite validates the runtime behaviour of `EventBus` from `src/eventBus/EventBus.ts`.

The goals are:

- Prove that handlers are stored and invoked per `(channel, type)` pair.
- Verify that subscription order is preserved.
- Confirm that `off` removes handlers and cleans empty maps.
- Ensure that `emit` is safe when there are no handlers.
- Validate error isolation: a throwing handler does not stop other handlers.
- Verify that `clear` removes all handlers.

## Components Covered

- `EventBus<EM>`
  - `on`
  - `off`
  - `emit`
  - `clear`

## Notes for Maintainers

If you refactor `EventBus` internals (for example, changing `Map` → `Record`), keep these invariants:

- `on` always returns a working unsubscribe function.
- `off` and the unsubscribe function must be idempotent (calling them multiple times is safe).
- `emit` must never throw due to user handler errors; failures are logged via `console.error`.
- `clear` removes all handlers; subsequent `emit` calls are no-ops.

This suite is intended both as a regression suite and as living documentation of how `EventBus` behaves.
