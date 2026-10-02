![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / When

# Type Alias: When\<EM\>

> **When**\<`EM`\> = \{ `any`: `true`; \} \| \{ `keys`: `ReadonlyArray`\<[`EventKey`](EventKey.md)\<`EM`\>\>; \} \| \{ `channel`: keyof `EM` & `string`; \} \| \{ `channels`: `ReadonlyArray`\<keyof `EM` & `string`\>; \} \| \{ `channelPattern`: `string`; \}

Defined in: [types.ts:1780](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1780)

Matcher for event targeting across reducers, effects, middleware, and subscriptions.

Supports five targeting modes:
- `{ any: true }` — match all events
- `{ keys: [...] }` — match specific `[channel, type]` pairs (correlated)
- `{ channel: 'x' }` — match all events in a channel
- `{ channels: ['x', 'y'] }` — match all events in multiple channels
- `{ channelPattern: 'x' }` — match channels by pattern, with `*` standing for zero or more
  characters. Untyped by construction: it exists to match channels the event map does not name.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.

## Remarks

The first four compare exactly. `channelPattern` is for the case they cannot express: a channel
that arrives namespaced, such as a peer's `alias::plan` beside a local `plan`, where a
guard wants both and cannot know the aliases in advance.

Without it such a guard has to match everything and filter in its own body, which costs the
pre-call skip and — more quietly — misreports itself, because the matcher an observer sees
through `onRegistrationChange` then says it matches the entire store.

`*` stands for zero or more characters, so `"*plan"` covers `plan` and `bb::plan` with one rule,
and `"*::plan"` covers only the namespaced forms. Everything else in the pattern is literal.

**`channelPattern` is for middleware only.** Reducers and effects take [ExactWhen](ExactWhen.md), and
registering one with a pattern throws. A reducer's input set has to be closed and readable from
its spec, or replaying the same log against the same code could fold a different set of events
once something adds a channel; and a pattern on an effect would enlist it, unseen, in the
sequential chain of every channel it matched.

A matcher of none of the five forms (`{}`, `{ any: false }`, `{ keys: "x" }`) also throws at
registration, on every seam: it used to be accepted and match nothing.

**It stays a string rather than a predicate on purpose.** A matcher is reported to observers and
travels to a devtools panel; a function would make every one of them opaque.

## Examples

```ts
const mw: MiddlewareSpec<S, EM> = {
  when: { any: true },
  middleware: (state, event, emit) => true,
};
```

```ts
const reducer: ReducerSpec<S, EM> = {
  state: { value: 0 },
  when: { keys: eventKeys<EM>()([['ui', 'increment'], ['ui', 'decrement']]) },
  reducer: (s, e) => { ... },
};
```

```ts
const effect: EffectSpec<S, EM> = {
  when: { channel: 'notifications' },
  effect: (e, getState, emit) => { ... },
};
```
