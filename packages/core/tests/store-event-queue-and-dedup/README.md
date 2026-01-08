# Store Event Queue and Dedup Suite

## Purpose

This suite focuses on the internal event queue and deduplication logic in `Store.emit`:

- Events are enqueued and processed FIFO.
- Re-entrancy is guarded so nested emits do not start multiple drain loops.
- `processedEventIds` prevents the same event from being processed more than once.
- The cleanup timer periodically clears `processedEventIds`.
- `dispose` clears the interval and internal tracking structures.

Because these are internal details, the tests reach into the store instance via `any`
to observe queue and timer state. This is acceptable for a core library where
correctness is more important than strict encapsulation in tests.

## Components Covered

- `emit` queue behaviour
- `processedEventIds` semantics
- `dispose`
- Event ID cleanup interval

## Notes for Maintainers

If you change how events are queued, deduplicated, or when cleanup runs,
update this suite accordingly. The key invariants are:

- No event can be processed twice due to re-entrancy.
- The queue always drains to completion.
- Cleanup does not break deduplication guarantees for in-flight events.
