# event-bus-event-arg

Covers the optional **source event** argument on `EventBus`.

`emit(channel, type, payload, event?)` forwards `event` to handlers as a second argument, and
`on(channel, type, handler)` accepts a handler declaring `(payload, event?)`. This exists so a
caller that already holds the real event — `Store.applyEventSync` and `Store.__replayEvents`
both do — can hand it to keyed reducers instead of forcing them to reconstruct one and invent
an `id`. See `store-keyed-reducer-event-identity` for the bug this fixes.

The change is additive and source-compatible in both directions: a handler declaring only
`payload` stays assignable (JavaScript ignores extra arguments), and an emitter that omits the
event still works, with handlers receiving `undefined`.

Covered:

- the source event reaches handlers that declare it, by reference;
- `undefined` is passed when the emitter supplies no event;
- single-argument handlers are unaffected;
- payload and event reach every subscriber, in subscription order;
- `off()` and the unsubscribe returned by `on()` still match on handler identity;
- a throwing handler is isolated and logged, and later handlers still receive the event.
