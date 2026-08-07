# store-emit-id-override

Covers three additions that let a caller control event identity and deduplication:
`EmitOptions.id`, `StoreSpec.idFactory` and `EmitOptions.skipDedup`.

**`EmitOptions.id`** makes re-emission idempotent: a caller replaying an event that originated
elsewhere — a peer store, a durable log — can preserve the original id so one logical event
keeps a single identity across systems and in DevTools. It is explicitly *not* a dedup key;
the store does not enforce uniqueness, and two emits sharing an id both land.

**`StoreSpec.idFactory`** replaces the default `crypto.randomUUID()`. Two reasons it exists:
portability, since `crypto.randomUUID` needs a secure context in browsers and is missing on
some runtimes where the default would throw on every emit; and determinism, since injecting a
counter makes ids stable across runs — which is what these tests use to assert exact ids.

**`EmitOptions.skipDedup`** escapes deduplication entirely. Content dedup fingerprints
`(channel, type, payload)`, so a store configured with `dedupWindowMs` silently collapses
genuinely distinct events that happen to share a payload — repeated empty-payload ticks, or
the same event legitimately arriving from two sources. It takes precedence over both
`dedupKey` and the store-level window.

Covered: explicit ids used verbatim; generated ids when unspecified; repeated explicit ids
*not* deduping; a custom `idFactory` honoured; explicit id winning over the factory; the
dedup-on baseline; `skipDedup` bypassing the store window and `dedupKey`; and `skipDedup:
false` leaving dedup active.

One documented consequence appears in the `dedupKey` test: a deduped emit returns *before* an
id is assigned, so it never consumes the `idFactory` — surviving ids stay consecutive.
