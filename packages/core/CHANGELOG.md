# Change Log - @yoltra/core

This log was last generated on Fri, 10 Jul 2026 07:51:29 GMT and should not be manually modified.

## 0.2.0
Fri, 10 Jul 2026 07:51:29 GMT

### Minor changes

- Two-phase emit pipeline: a synchronous reduce phase (middleware, reducers, subscribers, coarse listeners) followed by independent asynchronous per-event effects, with an honest per-event completion promise. Middleware is now synchronous. Content deduplication is opt-in (off by default). Adds a typed instrumentation seam via store.instrument(). Cheaper O(change) write path with dev-only freeze. BREAKING: synchronous middleware, dedup off by default, no production-time freeze.
- Add an onEffectError hook to createStore and StoreSpec. Effect errors are still logged to the console but can now also be routed to a caller-provided handler that receives the error and the failing event. Documents the contract: await emit() never rejects on effect failure because the reduce phase has already committed synchronously, and effects run as independent per-event tasks so the other effects for that event still run.

### Patches

- Security: gate __applyExternalState (devtools time-travel) behind devtools.allowReplay so a connected devtools client cannot replace store state unless replay is explicitly enabled.
- Fix a fine-grained reactivity bug in change detection: an object referenced from two sibling paths that genuinely changed was reported at only the first path, so components bound to the second path kept rendering stale values. Change detection now tracks only the ancestors on the active recursion path, so legitimate aliasing is fully diffed while cycles still terminate. Also treats two NaN values as equal instead of reporting a spurious change.
- Fix a memory leak on store disposal: dispose() now clears all coarse listeners, committed/uncommitted/all event subscribers, instrumentation observers, the connector and reducer buses, pattern reducers, and slice subscriptions, so a disposed store no longer retains references to subscriber closures.
- The processed-event dedup prune timer now starts lazily on the first cached event and stops when the cache drains, instead of only starting when dedupWindowMs is greater than 0. Identity dedup via dedupKey (which caches entries even at windowMs 0) is now pruned on idle rather than only at the 1000-entry cap, and the interval unrefs so it never keeps a Node process alive by itself.
- Effect metadata is now stored in a store-owned map keyed by the effect function, instead of being written onto the caller's function object. Registering the same handler on two stores no longer bleeds metadata between them, and the metadata no longer persists on the function after unregister.
- External state apply (devtools time-travel) now retains a slice that is missing from the incoming snapshot instead of blanking it to undefined, which previously made getState() of that slice throw on next access. A development warning names the missing slice.
- EMFromReducersStrict now merges each slice's event map (unioning channels and their type-to-payload entries) instead of collapsing them to a single slice's map, so a store whose slices declare divergent event maps types emit against the union of all of them.
- The wildcard pattern matcher (LooseEventBus) now uses an iterative two-pointer algorithm with backtracking instead of recursing and re-joining path suffixes for each ** position, removing per-suffix string allocation. Wildcard semantics are unchanged.

### Updates

- Internal lint hygiene only (prefer-const in the external-state apply path). No runtime or API change.

## 0.1.0
Thu, 26 Feb 2026 03:29:58 GMT

### Minor changes

- feat(core): rebrand library name from Quo.js to yoltra

