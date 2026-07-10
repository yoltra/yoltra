# Change Log - @yoltra/react

This log was last generated on Fri, 10 Jul 2026 07:51:29 GMT and should not be manually modified.

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

