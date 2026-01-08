# @quojs/core Test Suites

This directory contains Vitest suites for the core package.

Each suite lives in its own folder and is self-contained:

- `event-bus-basic/` – unit tests for `EventBus`.
- `loose-event-bus-patterns/` – unit tests for `LooseEventBus` pattern matching.
- `reducer-wrapper/` – unit tests for the `Reducer` wrapper class.
- `utils-detect-changed-props/` – unit tests for `detectChangedProps`.
- `utils-immutability/` – unit tests for `freezeState`.
- `store-static-helpers-and-typing-helpers/` – unit tests for `Store.buildAncestorPaths`, `typedEvents`, and `typedActions`.
- `store-basic-flow/` – integration tests for `createStore` and basic state flow.
- `store-middleware-and-effects/` – integration tests for middleware and effects.
- `store-dynamic-slices/` – integration tests for dynamic slice management.
- `store-devtools-and-state-restore/` – integration tests around Redux DevTools and external state restore.
- `store-event-queue-and-dedup/` – integration tests covering the event queue and deduplication.

Each suite folder contains:

- A `README.md` explaining the intent and invariants.
- One `*.test.ts` file with the actual Vitest tests.
- Optional `support/` modules with helper types or reducers.

Run all tests via:

```bash
pnpm vitest --coverage --watch=false
```
