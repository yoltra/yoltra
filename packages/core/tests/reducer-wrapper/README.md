# Reducer Wrapper Suite

## Purpose

This suite covers the thin `Reducer` wrapper in `src/reducer/Reducer.ts`.

The wrapper's job is simple but crucial:

- Hold a pure reducer function `(state, event) => nextState`.
- Expose a `reduce` method that forwards arguments and returns whatever the underlying reducer returns.

## Components Covered

- `Reducer<S, EM>`
  - constructor
  - `reduce`

## Notes for Maintainers

`Reducer` is intentionally minimal. The tests here ensure no extra behaviour is accidentally added:

- No mutation or side effects are introduced by the wrapper itself.
- Events are forwarded unchanged.
- Whatever the inner reducer returns is passed straight through.
