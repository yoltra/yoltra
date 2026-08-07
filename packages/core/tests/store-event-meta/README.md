# store-event-meta

Covers `EventMeta` — optional, opaque metadata carried alongside an event via
`EmitOptions.meta`.

The store never reads or acts on `meta`; it only carries it end to end so every consumer sees
the same value. That is what lets a layer above core (an audit trail, a tracing integration,
a transport bridging stores) attach provenance without smuggling it inside `payload`, where it
would pollute reducers and become part of the dedup fingerprint.

Two properties matter more than the happy path:

- **Absence is real absence.** When no `meta` is supplied the property is not present on the
  event at all — not set to `undefined`. The event object is byte-identical to one built
  before `meta` existed, so `Object.keys`, `JSON.stringify` and `toStrictEqual` are unaffected.
  This is why the implementation uses a conditional spread.
- **`meta` is not part of the dedup fingerprint.** Fingerprints are computed from
  `(channel, type, payload)`, so two events differing only in `meta` still dedupe. Callers who
  need both to land use `EmitOptions.skipDedup`.

Covered: delivery to keyed reducers, pattern reducers, middleware, effects, `onEvent`
subscribers and instrumentation (by reference, not a copy); delivery to *uncommitted*
subscribers and instrumentation when middleware vetoes; genuine absence when unsupplied;
exclusion from the dedup fingerprint; and propagation through `__replayEvents`.
