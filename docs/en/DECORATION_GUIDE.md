![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Decorating a store

> 👉 🇺🇸 English Version&nbsp; | &nbsp;[ 🇲🇽 Versión en Español](../es/DECORATION_GUIDE.md)

A store is created by an application. A capability is often written by somebody else: feature
flags, an undo history, a form validator. That library needs to add a slice, guard some
events and react to others, on a store it did not create and cannot change the definition of.

Yoltra already had the seams for that. What it did not have was types that survived using
them, or a guarantee that a hot reload would not quietly undo the whole thing.

---

## The shape of the problem

Before 0.8.0, decorating a store looked like this:

```typescript
// Don't write this any more.
store.registerReducer("flags", flagsSpec as any);
store.registerMiddleware(guard as any);
```

Two casts, and a third at every place the application later touched the slice, because
`registerReducer` took a plain `string` and returned nothing but a disposer. Nothing
downstream knew `flags` existed, what shape it had, or which channels it answered to.

0.8.0 removed the middleware cast and most of the rest. `registerReducer` kept its cast through
0.8.x: it was typed against the store's own event map, so a spec naming a channel the application
had never heard of could not typecheck. As of 0.9.0 it is generic over its spec, like
`registerSlice`, and returns the same `{ store, dispose }`. The exported `Store` class now carries
the same decoration signatures as `StoreInstance`, so code typed against the class decorates
without a cast too.

And then the developer saved a file:

```typescript
if (import.meta.hot) {
  import.meta.hot.accept("./reducers", (mod) => {
    store.replaceReducers(mod.reducers, { preserveState: true });
  });
}
```

That line, which core's own documentation recommended, deleted the library's slice **and its
state**. No error, no warning. The capability worked until the first hot reload.

---

## Declaring what a decoration contributes

Start with the spec builders. They exist for one reason, and it is worth understanding
because it explains the whole shape of the API.

A spec's `when` carries channel and type *strings*:

```typescript
when: { keys: [["flag", "enabled"]] }
```

Strings, and no payload types. There is nothing there to infer an event map from. And
TypeScript has no partial type-argument inference, so a hypothetical
`registerSlice<Name, State, EventMap>` would force you to hand-write the name and the state
type any time you wanted to name the event map.

`defineSlice` puts the event map in a **value** position, where inference does work:

```typescript
import { defineSlice } from "@yoltra/core";

type FlagsEM = {
  flag: { enabled: { id: string }; disabled: { id: string } };
};

export const flags = defineSlice<FlagsEM>()({
  state: { enabled: [] as string[] },
  when: { keys: [["flag", "enabled"]] },
  reducer: (s, e) => (e.type === "enabled" ? { enabled: [...s.enabled, e.payload.id] } : s),
});
```

Named once. Every registration site infers from it, with no type argument and no cast.

`defineMiddleware` and `defineEffect` do the same. **One consequence is worth knowing before
it surprises you: a bare middleware function can never widen the event map.**

```typescript
// Registers fine. Contributes no channels, and cannot.
store.withMiddleware((state, event) => true);

// Contributes its channels.
store.withMiddleware(defineMiddleware<FlagsEM>()({
  when: { channel: "flag" },
  middleware: () => true,
}));
```

`MiddlewareFunction`'s event parameter is `EventUnion<EM>`, a mapped type nothing can be
inferred back out of. Only the spec form carries the map.

---

## Growing the store's type

```typescript
const app = store.withSlice("flags", flags, { owner: "@scope/flags" });

app.getState().flags.enabled;          // string[]
app.emit("flag", "enabled", { id: "a1" });  // the new channel is emittable
```

`withSlice`, `withMiddleware` and `withEffect` all return the store with its types widened,
so calls chain:

```typescript
const app = store
  .withSlice("flags", flags)
  .withMiddleware(quota)
  .withEffect(uploader);
```

**It is the same object.** Decoration is a type-level operation: nothing re-subscribes, no
state moves, the dedup cache is untouched, and an in-flight `store.call()` carries on. Only
the type changes.

```typescript
store.withSlice("flags", flags) === store; // true
```

---

## Publishing a decorator

A library exports a function that takes a store and returns one:

```typescript
import type { EventMapBase, StoreInstance } from "@yoltra/core";

export function withFlags<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
>(store: StoreInstance<R, S, EM>, config: FlagsConfig) {
  return store.withSlice("flags", flags, { owner: "@scope/flags" });
}
```

Generic over the incoming store, which is the part that matters. `R`, `S` and `EM` are
inference sites, so they take whatever the caller actually has, and decorators compose by
nesting in any order:

```typescript
const decorated = withFlags(withUndo(store, undoConfig), config);
// or
const decorated = withUndo(withFlags(store, config), undoConfig);
```

Both reach the same type. A decorator that adds only events, wrapped around one that also
adds a slice, infers the already-widened values and carries them through.

`withDevtools(store, config)` is the degenerate case of this contract: it adds nothing and
returns the store unchanged.

### There is no `pipe`

It was considered and declined. Every decorator takes `(store, config)`, so each step in a
pipe needs a lambda to become unary:

```typescript
pipe(store, s => withA(s, cfgA), s => withB(s, cfgB))  // longer
withB(withA(store, cfgA), cfgB)                        // shorter
```

A pipe only pays for *curried* decorators, which would be a different convention from the one
`withDevtools` already set, and every extra generic layer is another place inference can
degrade. If four-deep nesting ever becomes common, a pipe is purely additive and can arrive
then.

### Requiring another decoration

Constrain the input. No registry, no ordering table:

```typescript
export function withAudit<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase & FlagsEM,   // ← the dependency
>(store: StoreInstance<R, S, EM>) {
  return store.withEffect(auditor);
}
```

Applied to a store that has not been decorated yet, this fails at the call site and names the
channels that are missing. It still composes, because TypeScript infers `EM` from the
argument and *then* checks the constraint.

For a dependency that leaves no type trace, a decoration that binds with `onEvent` and adds
no channels, check at runtime instead:

```typescript
store.onRegistrationChange(
  (changes) => {
    /* react, or throw naming what is missing */
  },
  { emitCurrent: true },
);
```

---

### When the decorator owns something the store must not hold

Everything above assumes a decorator's only product is the store. Sometimes it is not. A
decoration that owns a lifecycle, a connection, or a credential needs a way to hand that back,
and it must not park it in reduced state: state is snapshotted, frozen, diffed and shipped to a
devtools panel, so a token in a slice is a token in a transcript.

Three independent libraries in this ecosystem hit the same wall — one needing `drain()` as a
first-class call so a rolling deploy can announce departure and flush *without* tearing the store
down, one needing `suspend()`/`resume()`/`reattach()` on a live handle, one needing queue
introspection. All three returned a pair:

```typescript
export function withMesh<R extends string, S extends Record<R, any>, EM extends EventMapBase>(
  store: StoreInstance<R, S, EM>,
  config: MeshConfig,
) {
  const grown = store.withSlice("mesh", meshSlice).withMiddleware(meshGuard);
  const handle: MeshHandle = { drain, announce, close };
  return { store: grown, handle };
}
```

**Be clear about what that costs.** `StoreDecorator<D>` returns `Decorated<…>`, which is a store
and nothing else, so a pair is not a `StoreDecorator` and the two properties this guide is built
on both go:

- **Nesting.** `withB(withA(store))` no longer typechecks, because the outer call's parameter is a
  store. The caller destructures: `const { store: s1, handle } = withMesh(store); const s2 = withLog(s1);`
  As `There is no pipe` explains, nesting is the only composition mechanism, so losing it means
  composing by hand.
- **Dependency by constraint.** The `EM extends EventMapBase & RequiredEM` trick above works
  because the argument *is* a store. Against a pair the constraint has to be restated against
  `typeof pair.store`, which is more machinery than it is worth.

Widening itself survives: `.store` carries the grown type, so a chain still works if each step is
threaded by hand.

If you can avoid it, do. A decorator that only needs to clean up should return the store and keep
its disposer private, as `Disposal, and the one thing types cannot express` describes. Reach for a
handle when the thing you are handing back is genuinely not the store — and when you do, return
`{ store, handle }` rather than a handle carrying `.store`, so the store stays the obvious thing
to pass on.

---

## Surviving a hot reload

`replace*` replaces **what the application authored**. Anything registered after construction
survives, along with its state:

```typescript
store.registerSlice("flags", flags);   // a library's slice
store.replaceReducers(appReducers);            // the app's hot reload
store.getState().flags;                    // still here
```

You do not declare this and neither does the library. Provenance is recorded internally,
because correctness must not depend on anyone remembering to pass a string.

Four details follow from it:

- **`{ scope: "all" }`** restores the pre-0.8.0 behaviour exactly, for a test harness
  resetting a store between cases. `hotReplace` forwards it to all three.
- **A collision throws.** If the application authors a slice a library already mounted, you
  get an error naming the slice and its owner, thrown before anything is mutated. A silent
  takeover would leave the library holding a disposer for something no longer its own.
- **A debug line** says what was preserved, in development, so "why is that effect still
  firing after a reload" has an answer.
- **The types agree.** Since 0.10.0 `replaceReducers` and `hotReplace({ reducer })` take a
  `ReducerReplacement`: every slice optional, each typed with its own slice's state. Leaving out
  the library's slice typechecks, which is the call the runtime expects.

---

## React

```typescript
// state/yoltra.ts - module scope, once.
export const app = createYoltra({ name: "App", reducer: { counter } })
  .withSlice("flags", flags);

export const { useAtomicProp, useEmit, useEvent } = app;
```

`useAtomicProp({ reducer: "flags", property: "enabled" })` is typed, on a slice the
application never declared.

Three things to know:

- **Module scope, once, before the first render.** Each `with*` builds a new hook set, because
  `createHooks` allocates fresh function objects. Calling one inside a component would hand
  React a different `useAtomicProp` on every render.
- **Providers interoperate.** The context object is re-typed, never recreated, so a
  `<StoreProvider>` from any view in the chain serves the hooks of every other. The Suspense
  cache is shared for the same reason: it keys on store identity.
- **Free functions exist** for a library handed a `Yoltra` it did not create:
  `withSlice(yoltra, name, spec)`.

---

## Targeting a channel you cannot name in advance

`when` compares exactly: `{ channel: "plan" }` matches `plan` and nothing else. That is a problem
for a guard whose channels arrive namespaced, such as a peer's `bb::plan` beside a local `plan`,
because the aliases are chosen by whoever connects the peers, so no list can be written ahead of time.

`channelPattern` is for that, with `*` standing for zero or more characters. `*` is the only
metacharacter; everything else in the pattern is literal, so `"*::plan"` covers only the namespaced
forms, and no pattern can turn into an expression that backtracks. It stays a string rather than a
predicate because a matcher is reported to observers and travels to a devtools panel, where a
function would be opaque. It is also untyped by construction: it exists to match channels the event
map does not name.

```typescript
export const rateGuard: MiddlewareSpec<S, EM> = {
  when: { channelPattern: "*plan" },   // `plan` and `bb::plan`
  middleware: (state, event) => withinBudget(event.channel),
};
```

**Middleware only.** Reducers and effects take the four exact forms, typed as `ExactWhen`, and
since 0.10.0 registering either with a `channelPattern` throws and names it. Before that it was
accepted and handled nothing: the reducer never ran, and the effect was not even reported to
`onRegistrationChange`. A reducer's input set has to stay closed, so that replaying a log against
the same code folds the same events whatever a decoration adds later; and every effect for an event
runs in sequence, so a pattern would enlist one in the chain of every channel it matched. Name the
channels instead, or keep the pattern on a middleware. A `when` of none of the five forms, such as
`{}` or `{ any: false }`, throws on every seam for the same reason: it used to match nothing.

**There is a trap here worth more than the feature.** A guard that already filters in its own body,
on a stripped base channel, looks like it would be faster with `when` — and converting it to
`{ channel: "plan" }` silently stops it seeing every namespaced channel. Nothing throws. The guard
keeps running, keeps returning `true`, and no longer guards the traffic it was written for. A
consuming runtime came within a review of shipping exactly that, on the one defence its design
assigned to bounding peer traffic.

So if a middleware filters on anything less than the whole channel string, it is not a candidate
for `{ channel }`. Use `channelPattern`, or leave the filter in the body.

Matching everything and filtering by hand has a second cost besides the pre-call skip: the matcher
is what `onRegistrationChange` reports, so a guard written that way tells every observer it matches
the entire store.

---

## Watching what is installed

`onRegistrationChange` tells you when a store gains or loses a reducer, middleware or effect.
Devtools uses it to keep its panel current; a library can use it to react to another library.

```typescript
const off = store.onRegistrationChange(
  (changes) => {
    for (const c of changes) {
      if (c.origin === "internal") continue;   // the store's own machinery
      console.log(c.op, c.kind, c.name, c.owner, c.when);
    }
  },
  { emitCurrent: true },
);
```

- **Changes arrive in batches**, one per public call. `replaceReducers` updates a slice by
  unmounting and remounting it, so a per-change view would show something merely being updated
  disappearing.
- **`emitCurrent`** synthesizes a mounted change for everything already installed, delivered
  before the call returns. Spec-time registrations happen inside `createStore`, so a decorator
  applied afterwards never saw them arrive.
- **`state` has four values** for a reducer, and the fourth is the one to watch: `"retained"`
  means the slice's state survived an unmount, `"deleted"` means it did not. Treating every
  unmount as destruction will tear down a subscription you are about to need.
- **Registering from inside an observer is fine.** It is queued, not delivered re-entrantly,
  so nobody ever sees a half-built topology.
- **`when` is the normalized matcher**, what will actually match rather than what the spec
  said. A keyed slice reports `{ keys }`, and middleware registered as a plain function reports
  `{ any: true }`, as an untargeted effect always has. Both reported nothing useful before 0.9.0.
  `__devtoolsIntrospect` reports the same matchers.
- Replay produces no changes. It alters state, never topology.

---

## Disposal, and the one thing types cannot express

`withSlice` returns no disposer. That is deliberate.

After a disposer runs, the widened type still promises a slice that is gone, and no type
system can say "valid until that call". So the chaining API does not hand one out, and the
footgun stays off the path most people take.

When you own the slice and need teardown, use `registerSlice`:

```typescript
const reg = store.registerSlice("flags", flags, { owner: "@scope/flags" });
reg.store;      // the widened store
reg.dispose();  // library-private: do not export this
```

**Keep that disposer inside the library.** Handing it to application code hands out the
ability to invalidate types the application is still relying on.

Reading a disposed slice throws a named error in development rather than returning
`undefined` from a type that promised a value:

> `[yoltra] Slice "flags" was unmounted by its owner (@scope/flags). Hooks and
> subscriptions widened for it are no longer valid.`

---

## Ordering

Decorate at module scope, at import time, before the first render. Between `createStore` and
the decoration the slice genuinely does not exist, and a component reading it sees `undefined`
until it does. That window is safe, not broken, and it closes as soon as the slice mounts.
