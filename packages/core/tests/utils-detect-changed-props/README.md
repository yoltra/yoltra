# detectChangedProps Suite

## Purpose

This suite verifies the behaviour of `detectChangedProps` from `src/utils/detectChangedProps.ts`.

The function is a deep diff that returns **dotted leaf paths** where values changed, with
special cases for arrays, Dates, RegExps, and cycles.

## Components Covered

- `detectChangedProps(oldState, newState, path?, seenPairs?)`

## Scenarios

- Early exit on reference equality.
- Primitive and null differences.
- Date and RegExp comparison semantics.
- Array comparison (same length vs length changes).
- Object key add/remove/change handling via union of keys.
- Cycle/alias safety using `seenPairs`.

## Notes for Maintainers

If you tweak the diffing algorithm, ensure that:

- Leaf paths remain stable and predictable.
- Arrays with length changes are still treated as a single changed path at the array key.
- Cycles do not cause unbounded recursion.

This suite should catch regressions in these invariants.
