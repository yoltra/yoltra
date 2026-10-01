![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Upgrading to 0.10.0

> 👉 🇺🇸 English Version&nbsp; | &nbsp;[ 🇲🇽 Versión en Español](../es/UPGRADE_0.10.md)

What changed, how you would notice, and what to do. Pre-1.0, so this is a MINOR bump by
[the repository's policy](../../CONTRIBUTING.md).

---

## A reducer or an effect with `channelPattern` now throws

**You will notice if:** a reducer or an effect is registered with `when: { channelPattern }`, or
any `when` takes none of the five forms. `createStore`, `registerReducer`, `registerSlice`,
`registerEffect`, `replaceReducers`, `replaceEffects` and `hotReplace` throw an `Error` naming the
registration. TypeScript reports it first: `ReducerSpec.when` and `EffectSpec.when` are now typed
`ExactWhen`.

`channelPattern` was only ever honoured by middleware. On a reducer or an effect it was accepted
without a word and **handled nothing**: the reducer never ran, so its slice stayed at its initial
state, and the effect was not even reported to `onRegistrationChange`. If your code registered one,
it has never worked, and this release makes that visible.

Reducers stay exact on purpose. Their input set has to stay closed, so that replaying a log
against the same code folds the same events whatever a decoration adds later. Effects for one
event run in sequence, and a pattern would enlist an effect in the chain of every channel it
matched.

```ts
// Before: accepted, and the reducer never ran.
store.registerReducer("plans", { state, when: { channelPattern: "*plan" }, reducer });

// After: name the channels the slice folds.
store.registerReducer("plans", { state, when: { channels: ["plan", "bb::plan"] }, reducer });
```

If the channels cannot be named in advance, keep the pattern on a middleware, where it is
supported.

**The same check now covers every seam.** A `when` of none of the five forms, such as `{}`,
`{ any: false }` or `{ keys: "plan" }`, throws on reducers, effects and middleware alike. It used
to match nothing. `{ keys: [] }` and `{ channels: [] }` are still accepted, because they are
well-formed and a list can legitimately be empty.

**A refused call changes nothing.** Each entry point checks the whole batch before it touches the
store, so a `replaceReducers` or `hotReplace` that throws leaves the previous reducers, effects and
middleware installed and running.

---

## Additions you may want

**`ExactWhen<EM>`**, the `When` forms a reducer or an effect accepts (`When` without
`channelPattern`). Use it to type a helper that builds reducer or effect specs.
