![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / StoreSpec

# Type Alias: StoreSpec\<R, S, EM\>

> **StoreSpec**\<`R`, `S`, `EM`\> = `object`

Defined in: [types.ts:356](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L356)

Store configuration object passed to the [Store](../classes/Store.md) constructor or [createStore](../functions/createStore.md).

## Example

```ts
type S = { counter: { value: number } };
type EM = { ui: { increment: number } };

const spec: StoreSpec<'counter', S, EM> = {
  name: 'App',
  reducer: {
    counter: {
      state: { value: 0 },
      when: { keys: eventKeys<EM>()([['ui', 'increment']]) },
      reducer(s, evt) {
        if (evt.type === 'increment') return { value: s.value + evt.payload };
        return s;
      }
    }
  }
};
```

## Type Parameters

### R

`R` *extends* `string`

Reducer name union (string literal union).

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.

## Properties

### dedupWindowMs?

> `optional` **dedupWindowMs**: `number`

Defined in: [types.ts:394](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L394)

Time window in milliseconds for **content-based** event deduplication.
When greater than 0, events with identical fingerprints
(channel + type + serialized payload) within this window are treated as
duplicates and skipped.

**Off by default.** Content-based dedup can silently drop legitimate
rapid-fire identical events (double-clicks, repeated `+1`, sliders emitting
the same value), so it is opt-in. To safely coalesce a *specific* re-fired
emit (e.g. React Strict Mode), prefer the per-emit [EmitOptions.dedupKey](../interfaces/EmitOptions.md#dedupkey).

#### Default

```ts
0 (disabled)
```

***

### devtools?

> `optional` **devtools**: `object`

Defined in: [types.ts:423](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L423)

DevTools configuration options.

#### allowReplay?

> `optional` **allowReplay**: `boolean`

Enable event replay via `__replayEvents()`.
When `false` (default), calling `__replayEvents()` throws.

##### Default

```ts
false
```

#### Remarks

These options control runtime DevTools capabilities such as event replay.

***

### effects?

> `optional` **effects**: [`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](DeepReadonly.md)\<`S`\>, `EM`\>[]

Defined in: [types.ts:379](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L379)

Optional side-effect handlers registered at construction time.
Runs after reducers for every propagated event.

***

### idFactory()?

> `optional` **idFactory**: () => `string`

Defined in: [types.ts:415](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L415)

Generates the `id` for each emitted event. Defaults to `crypto.randomUUID()`.

#### Returns

`string`

#### Remarks

Two reasons to override it. First, portability: `crypto.randomUUID` requires a **secure
context** in browsers and is absent on some runtimes (React Native / Hermes), where the
default would throw on every emit. Second, determinism: injecting a counter makes event
ids stable across runs, which is what allows byte-exact assertions in tests.

The factory must return a string. Uniqueness is the caller's responsibility.

#### Default

```ts
() => crypto.randomUUID()
```

#### Example

```ts
let n = 0;
const store = createStore({ name: 'Test', reducer, idFactory: () => `evt-${++n}` });
```

***

### middleware?

> `optional` **middleware**: [`MiddlewareInput`](MiddlewareInput.md)\<[`DeepReadonly`](DeepReadonly.md)\<`S`\>, `EM`\>[]

Defined in: [types.ts:373](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L373)

Middleware chain executed before reducers/effects.
Accepts either functions (legacy) or MiddlewareSpec objects (recommended).
If any middleware returns false (or resolves to false), the event will not propagate.

***

### name

> **name**: `string`

Defined in: [types.ts:360](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L360)

Store name (used by DevTools to identify the instance).

***

### onEffectError()?

> `optional` **onEffectError**: (`error`, `event`) => `void`

Defined in: [types.ts:446](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L446)

Called when an effect throws or its returned promise rejects.

#### Parameters

##### error

`unknown`

The thrown value or rejection reason.

##### event

[`EventUnion`](EventUnion.md)\<`EM`\>

The event whose effect failed.

#### Returns

`void`

#### Remarks

`await emit(...)` **never rejects** on effect failure: the reduce phase has
already committed synchronously, and effects run as independent per-event
tasks. Effect errors are logged to the console and delivered here (when
provided), so this is the single place to observe and route them — e.g.
report to a service or emit a failure event. Other effects still run.

***

### onReducerError()?

> `optional` **onReducerError**: (`error`, `event`, `slice`) => `void`

Defined in: [types.ts:466](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L466)

Invoked when a reducer throws.

#### Parameters

##### error

`unknown`

The thrown value.

##### event

[`EventUnion`](EventUnion.md)\<`EM`\>

The event being reduced when it threw.

##### slice

`string`

Name of the slice whose reducer threw.

#### Returns

`void`

#### Remarks

A reducer is meant to be pure and total, so a throw is a bug in application code — and it
used to be almost invisible. Keyed reducers ran through a bus that logged and moved on,
letting the event commit and its effects run; pattern reducers threw straight out of the
drain, aborting the commit and notifying nobody. Both paths now isolate the failing slice
and report here.

The failing slice keeps its previous state; every other slice still reduces, and the event
still commits if anything else changed. `emit()` never rejects because of a reducer error,
so this hook is how a caller observes one.

***

### reducer

> **reducer**: `Record`\<`R`, [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`S`\[`R`\], `EM`\>\>

Defined in: [types.ts:366](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L366)

Map of slice name → reducer spec.
Each entry declares initial state, the reducer function, and the event targeting.
