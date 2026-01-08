# freezeState Suite

## Purpose

This suite validates the behaviour of `freezeState` from `src/utils/immutability.ts`.

`freezeState` is responsible for deep-freezing store state snapshots to discourage accidental mutation.

## Components Covered

- `freezeState<T>(obj, seen?)`

## Scenarios

- Primitives and null are returned as-is.
- Objects and arrays are deep-frozen, including nested structures.
- Already frozen objects are returned unchanged.
- Cycles are handled safely.
- Symbol-keyed properties are frozen.
- Getter/setter properties are skipped without error.

## Notes for Maintainers

`freezeState` is called in the store pipeline before committing new slices. It must be:

- Safe on arbitrary user structures.
- Idempotent (calling it twice is safe).
- Correct with respect to `Object.isFrozen` expectations.

If you update the implementation, align this suite to reflect the intended contract.
