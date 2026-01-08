# Store Middleware and Effects Suite

## Purpose

This suite focuses on the event processing pipeline inside `Store.emit`:

1. Middleware (pre-reducer)
2. Reducers
3. Effects (post-reducer)
4. Coarse subscribers
5. DevTools logging (the logging aspect is covered more extensively in the DevTools suite)

It verifies that:

- Middleware run in order and can cancel propagation.
- Errors in middleware are logged and cancel the event.
- Effects see the final state after reducers.
- Effect errors are logged without crashing the pipeline.
- The registration and replacement APIs behave as expected.

## Components Covered

- `emit` (middleware + effects behaviour)
- `registerMiddleware`
- `registerEffect`
- `replaceMiddleware`
- `replaceEffects`

## Notes for Maintainers

If you alter the event pipeline (order, error handling, or cancellation semantics),
update this suite to reflect the new behaviour. It serves as a practical reference for
users about how middleware and effects are expected to behave.
