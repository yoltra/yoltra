# store-keyed-reducer-event-identity

Pins the invariant that **one emit produces exactly one event id**, seen identically by
every consumer.

Keyed reducers — those targeting an exact `[channel, type]` — are wired through
`reducerBus` in `mountSlice`. The bus used to carry only the payload, so the bus handler
reconstructed an event and minted a fresh `crypto.randomUUID()` for it. The consequence was
that `event.id` inside a keyed reducer was a value nothing else in the system had ever seen:

- two keyed reducers responding to the same emit each got their own unrelated id;
- the id in a keyed reducer never matched the one in effects, event subscribers,
  instrumentation, or the DevTools event log;
- `__replayEvents` hit the same path, so replaying an event with a known id still produced
  a random one inside keyed reducers.

Pattern reducers (`when: { any }` / `{ channel }` / `{ channels }`) always received the real
event object, so they serve as the oracle in these tests.

Covered:

- a keyed reducer, a pattern reducer, a keyed effect, an `onEvent` subscriber and
  `instrument()` all observe the same id for one emit;
- two keyed reducers on the same emit agree with each other;
- `__replayEvents` preserves the caller-supplied id all the way into keyed reducers.

All three assertions fail on the pre-fix implementation.
