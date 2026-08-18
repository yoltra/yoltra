# Change Log - @yoltra/react

This log was last generated on Tue, 18 Aug 2026 01:10:17 GMT and should not be manually modified.

## 0.6.0
Tue, 18 Aug 2026 01:10:17 GMT

### Minor changes

- Uses the NotifiedPhase type exported by @yoltra/core rather than restating the set of phases a handler can be told about.

Three handler signatures here spelled out "committed" | "uncommitted" by hand. When core gained a "written" phase those copies were left claiming a handler could only ever see two, and the build failed on the mismatch. NotifiedPhase is EventPhase minus "all" - which selects a subscription but is never delivered - so the set stays core's to define and a phase added later cannot leave stale copies behind.

Consumers who annotated a phase parameter with the literal union will hit the same compile error and want the same fix.
- Exports the `SuspenseCache` type. `suspenseCache` publishes an instance of it, so the type was reachable through a published value while being marked internal — a shape consumers could hold but not name. The class itself is still not constructible from outside; only its type is exported, and its internals stay private.

## 0.5.0
Sat, 15 Aug 2026 22:14:53 GMT

### Minor changes

- Picks up the corrected `Dotted` and `PathValue` from `@yoltra/core`, so `useAtomicProp({ reducer, property: "" })` on a slice that holds a single value returns that value's type rather than `unknown` — it used to miss the typed overload and fall through to the `property: string` one.\n\nInference through an object slice is unchanged, and is now pinned: type-level tests assert the resolved type of every path form (nested leaf, array index, whole array, whole Map, and the accessor form) through `createYoltra`, the way an application actually gets its hooks.

### Updates

- Corrects the typed-path accessor warning, which promised that an empty path subscribes to "the entire slice". It subscribes to the slice root, which fires only when the slice's whole value is replaced — for an object slice, never. Adds explicit extensions to the relative specifiers of published declaration files. Extensionless relative re-exports do not resolve under `moduleResolution: nodenext`, and because nearly every project sets `skipLibCheck: true` the errors were suppressed while every re-exported symbol silently degraded to `any`.

## 0.4.0
Fri, 07 Aug 2026 13:15:02 GMT

### Minor changes

- `useAtomicProps` now hands its selector only the paths declared alongside it, rather than the whole store.\n\nThe two arguments used to be independent: a list of paths that wake the component, and a selector given all of state. Nothing tied them together, so subscribing to one path and reading another compiled, ran, and worked for exactly as long as the two happened to change together. This repository shipped that bug in its own example — a list subscribed to `todo.filter` while reading `todo.data`, re-rendering only because adding a todo also rewrote `filter.categories`. An edit that left the categories alone would have rendered stale rows and reported nothing.\n\nThe fix removes the opportunity rather than detecting the mistake. Reading undeclared state is now `undefined` on the first render instead of a correct value that goes stale later, and in development it throws with the path named and the existing declarations listed. Wildcards are expanded against real state rather than approximated by their static prefix, since handing over everything under `items.*` would reopen the same hole one level down. Containers are rebuilt preserving arrays as arrays, and leaves are copied by reference so identity-based memoization downstream is unaffected.\n\nBreaking only for code that was already wrong: every existing test passed unchanged.
- Adds `useEntityIds`, `useEntity` and `useEntityField`, pairing with `createEntityAdapter`. Thin wrappers over `useAtomicProp` whose value is that the subscription path comes from the adapter rather than being written by hand in a component, where nothing verifies it and an id-format change breaks it silently.
- BREAKING (pre-1.0): the standalone useAtomicProp, useAtomicProps, useSuspenseAtomicProp and useSuspenseAtomicProps exports are gone from the package barrel. With no store context to infer from, every standalone call site needed explicit type parameters — four of them — and the identical hooks arrive fully inferred from createHooks or createYoltra, which the docs have recommended all along. The pruning also converts a runtime footgun into a compile error: a barrel copy read the package-level context, so mixing it with bound hooks threw inside a provider-less tree with nothing in the types to warn you. The context-generic simple hooks (useSelector, useEmit, useEvent, useStore) and the suspense cache utilities remain.
- `createYoltra` and `createHooks` now return `useSuspenseAtomicProp` and `useSuspenseAtomicProps` bound to their own context, so the hook set they hand back is complete.\n\nThose two were only ever exported from the package barrel, where they read the package-level `StoreContext`. Neither factory fills that context — both build a private one — so reaching for Suspense alongside them threw `useStore must be used inside <StoreProvider>` the moment the component rendered. Nothing in the types said so, because the barrel's copies and the bound ones are identical in shape, and the workaround (mount a `<StoreProvider>` carrying the store the factory already returned) reads as ceremony rather than as the fix for a real split.\n\nSuspense cache entries are now scoped per store as well. Keys were `reducer::path`, which two stores sharing a reducer name collide on: whichever loaded first served its value to the other. That was already reachable by scoping a store with `<StoreProvider>`, and binding the hooks per context makes it ordinary. `invalidateAtomicProp` and `invalidateAtomicPropsByReducer` name a path and no store, so they clear that path in every store that cached it; the by-reducer form also now reaches multi-path entries where the reducer is not the first component of the key.\n\nThe barrel's copies are unchanged and still read the package-level context — the right choice when you are providing the store with `<StoreProvider>` anyway.
- A failed Suspense load is now delivered to the nearest boundary once and then forgotten, so resetting that boundary retries.\n\nCached errors used to be held until something invalidated them, which meant a retry button could not retry: the boundary reset, the component re-rendered, and the stored error was thrown again without the loader ever running a second time. A transient network failure became permanent for the life of the page.\n\nDelivery is tracked explicitly rather than by clock. Expiring the entry on time alone drops it during the gap between the load rejecting and React re-rendering, so the component suspends again instead of surfacing the error — a silent retry loop in place of a visible failure.\n\n`errorTtlMs` puts a floor between attempts for a loader that fails fast, and `null` restores the old hold-until-invalidated behaviour as something a caller asks for rather than the default nobody chose.

### Patches

- Drops react-dom from peerDependencies. No source file imports it — the hooks build on useSyncExternalStore, which lives in react itself — while the exports map advertises a react-native condition that react-dom cannot satisfy. Requiring it turned away React Native and react-test-renderer consumers for a dependency the package never used.
- The package is now type-checked and built with strict mode. Its tsconfig never set it and the build config extends that file, so the published declarations for a library whose selling point is end-to-end type safety were emitted checked more loosely than the code consuming them. The source turned out to be strict-clean already — nothing had been verifying it. Coverage thresholds were also written as fractions, which Vitest reads as percentages: the gate believed to require 95% was enforcing 0.95%. They are now real per-metric percentages set at the level actually met, so a regression fails the build.
- The Suspense cache is bounded. Keys are built from the reducer and the subscribed path, so a component reading a dynamic path mints one per value it has ever seen — unbounded, that grew for the lifetime of the process, and because the cache is module-scoped it grew across server requests too. Entries are now capped with least-recently-used eviction, keyed on read order rather than load order, and a load still in flight is never evicted: a suspended component is waiting on that promise and dropping it would leave it suspended with nothing to resume it.

### Updates

- Raise the branch and function coverage floors to 95 percent, backed by new tests for the bound useEvent and the array-property form of useAtomicProps — the flavors that became the only flavors when the standalone hooks left the barrel — and for the typed path accessor's refusal edges.

## 0.3.0
Sun, 12 Jul 2026 00:20:57 GMT

_Version update only_

## 0.2.0
Fri, 10 Jul 2026 07:51:29 GMT

### Minor changes

- Adds createYoltra(): one call returns the store plus every typed hook, defaulting to that store so no Provider is required. Adds typed path accessors for useAtomicProp (autocompleted, inferred return type). Stable memo key for useAtomicProps.
- createYoltra now accepts the onEffectError option (forwarded to the store), and the YoltraHooks and Yoltra return types are exported so consumers can name the shape returned by createHooks and createYoltra.

### Patches

- Fix the Suspense cache lifecycle at the default staleTime of 0: a pending load is never time-expired (the same in-flight promise is re-thrown until it settles) and a cached error is re-thrown until invalidated, so useSuspenseAtomicProp and useSuspenseAtomicProps no longer start a fresh load on every render (previously an infinite suspend or request storm). staleTime 0 now means serve a resolved value until it is invalidated; a positive value adds a wall-clock TTL.
- Fix a TS2742 portable-type error: a composite or declaration build that re-exported the result of createYoltra failed to emit its .d.ts because the inferred type referenced an internal shallowEqual. shallowEqual is now single-sourced, and createHooks and createYoltra have explicit named return types (YoltraHooks and Yoltra).
- Harden the typed path accessor: calling a method inside the accessor (for example p => p.items.map(...)) now throws a clear error instead of an opaque one, and an accessor that records no property access warns in development because it would silently subscribe to the whole slice. The accessor must be a plain member chain.
- The Suspense hooks no longer throw a promise during server rendering (which crashed renderToString). getServerSnapshot returns the current value at the path without loading (single) or a synchronous load result if available otherwise undefined (multi). Documented that createYoltra's singleton store and the module Suspense cache are client-only; for SSR create a store per request and scope it with StoreProvider.
- getSnapshot for useSelector, useAtomicProp, useAtomicProps, and the Suspense hooks is now stable across renders even when map/selector/isEqual/options are passed inline (the common case). The latest closures are read from refs via a shared useStableSnapshot helper, so the memoized value is no longer discarded every render.
- useAtomicProps now tracks whether it has a cached value with a boolean flag instead of using undefined as a no-value sentinel, so a selector that legitimately returns undefined still uses the equality cache.
- useStore now throws a clearer error when no store is in context, explaining that the hooks from createYoltra default to their own store and that StoreProvider is only needed to supply or scope a different one.
- Tightened internal any types: getAtPath is now generic over the returned value type (unknown by default) taking unknown input, and toDottedPath's accessor returns unknown. shallowEqual was already narrowed to Record of unknown.
- specsSignature now length-prefixes each segment, so a reducer name or dotted path that contains a delimiter character can no longer collide with a different spec array in the useAtomicProps memo key.
- The standalone useAtomicProp now always calls a single internal implementation regardless of whether a map function is passed, so toggling map presence between renders can no longer cause a Rules-of-Hooks violation. The redundant second implementation was removed.

### Updates

- Internal lint hygiene only: rename the private atomic-prop implementation hooks so the react-hooks lint rule recognizes them, and annotate the intentional signature-keyed memo dependencies. No runtime or API change.

## 0.1.0
Thu, 26 Feb 2026 03:29:58 GMT

### Minor changes

- feat(react): rebrand library name from Quo.js to yoltra

