# yoltra Core — Advanced Coverage Test Suite Documentation

## Purpose

This suite exercises edge‑case branches and HMR‑style APIs that are not covered by the basic unit/integration suites. These scenarios matter because for yoltra, correctness is critical and the `Store` is the central orchestrator.

The goal of this suite is not to provide “example usage” for end users, but to:
- drive coverage of branches that would otherwise be unreachable,
- validate error semantics and cleanup behavior,
- confirm DevTools/HMR/replace paths,
- confirm deprecated APIs and legacy interfaces.

---

## Tested Areas

### 1. `dispose()`
Verifies:
- cleanup timer cleared,
- processedEventIds cleared,
- idempotent second call.

### 2. `__applyExternalState()`
Cases:
- reference‑equal slices → no‑op,
- deep‑equal incoming state → commit + coarse subscribers only,
- mixed leaf paths and ancestor path emission.

Why it matters:
DevTools time‑travel/import relies on this branch and cannot regress silently.

### 3. DevTools Baseline Re‑Init
Trigger: `replaceReducers()`
Ensures:
- DevTools `.init()` invoked with new baseline,
- instance ID preserved.

Necessary to avoid divergent DevTools history after HMR.

### 4. `hotReplace()` Partial Replacement
Independently replaces:
- middleware,
- effects,
- reducers (with `preserveState` true/false).

Confirms old handlers no longer fire and new ones do.

### 5. `mountSlice()` / `unmountSlice()`
Cases:
- empty `events` spec,
- slices without prior wiring,
- unsubs that throw (error path),
- state deletion correctness.

### 6. `emit()` Error Semantics
Two categories:
- middleware errors (inner try/catch),
- reducerBus errors (outer try/catch).

Ensures logs match expected failure modes and queue continues.

### 7. `dispatch()` (Deprecated)
Confirms:
- forwards to `emit()`,
- logs deprecation warning in non‑production.

### 8. Helpers
Coverage for:
- `getAtPath()` (empty path, leading dot, missing branch),
- `buildAncestorPaths()`,
- `typedEvents()` + `typedActions()` aliasing.

---

## Why These Tests Exist

Most of these branches are defensive engineering. They exist for:
- DevTools integration,
- HMR friendliness,
- state time‑travel,
- strict immutability guarantees,
- resilience in runtime pipelines,
- backwards compatibility (e.g., `dispatch()`),
- correctness under React Strict Mode.

These tests prevent regressions that are notoriously easy to introduce during refactors.

---

## What They **Don’t** Test

They do **not** focus on:
- standard reducer logic,
- standard effects,
- middleware pipeline semantics beyond error cases,
- consumer‑facing “docs” examples.

Those belong to the basic flow + integration suites.

---

## Relationship to Coverage

These tests push the `Store.ts` implementation to ~100% coverage by touching rare but real production paths, specifically:

- cleanup timers,
- HMR updates,
- deep time‑travel patches,
- error boundaries,
- deprecated API routes,
- empty reducer/event specs,
- low‑level path helpers.

Without these tests, coverage stalls around ~70‑80% even with strong basic suites.

---

## CI / Maintenance Notes

If the Store changes:

- Update tests whenever:
  - DevTools wiring changes,
  - `hotReplace` signature changes,
  - `replaceX` methods move,
  - `dispatch` is removed (v1.0.0 target).

- If DevTools becomes optional or feature‑flagged, guard tests under env.

- If the event queue or middleware pipeline changes, revisit the error path assertions.

---

## Conclusion

The advanced coverage suite ensures yoltra’s most complex branches remain safe against refactors. These branches are expensive to test manually and extremely easy to break, so automated tests are justified and critical.