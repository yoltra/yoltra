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

## The key-collision warning is kept per store

**You will notice if:** a process runs several stores in development, such as a test suite or a
server rendering more than one, and two `(channel, type)` pairs in one store join to the same
internal key.

The warning used to be remembered for the whole process. Once one store had reported a key, a second
store with the same collision stayed silent; and two stores that each used *one* of the pairs, which
cannot interfere, were reported as colliding. It is now kept per store and names the store. No code
change is needed; you may see a warning that was previously suppressed, or lose one that was wrong.

---

## `replaceReducers` and `hotReplace` type each slice on its own

**You will notice if:** you call `replaceReducers` or `hotReplace({ reducer })` on a store with two
or more slices, or on a store a library decorated.

The argument used to require every slice name and type each reducer with the union of every
slice's state. An annotated reducer failed to compile on any store with two slices, a reducer for
one slice could return another's state, and on a decorated store the only call that compiled named
the library's slice, which the runtime refuses. It is now `ReducerReplacement`: every key optional,
each typed with its own slice's state, which is what the runtime has done since 0.8.0. Code that
compiled before still compiles unless a reducer returned the wrong slice's state.

`EventFromWhen` also gains its `channelPattern` arm: it resolves to the whole event union, which is
what a middleware handler receives, instead of `never`.

---

## Additions you may want

**`ExactWhen<EM>`**, the `When` forms a reducer or an effect accepts (`When` without
`channelPattern`). Use it to type a helper that builds reducer or effect specs.

**`ReducerReplacement<R, S, EM>`**, the argument `replaceReducers` takes, for typing an HMR handler
that builds the map before calling it.
