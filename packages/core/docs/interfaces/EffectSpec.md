[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EffectSpec

# Interface: EffectSpec\<S, EM\>

Defined in: [types.ts:511](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L511)

Effect specification (stateless async event consumer).

## Remarks

- Effects run after reducers see the event.
- Effects are async-safe and do not own state.
- Effects are keyed by event for O(1) lookup (no scanning).
- Use `when` for event targeting (preferred over `events`).

## Examples

```ts
const logEffect: EffectSpec<AppState, MyEM> = {
  when: { keys: eventKeys<MyEM>()([['ui', 'increment']]) },
  effect: async (evt, getState, emit) => {
    console.log('increment', evt.payload, getState().counter.value);
  },
  meta: { type: 'effect', name: 'logEffect', description: 'Logs increment events' },
};
```

```ts
const notificationEffect: EffectSpec<AppState, MyEM> = {
  when: { channel: 'notifications' },
  effect: (evt, getState, emit) => {
    if (evt.type === 'show') showToast(evt.payload.message);
  },
};
```

## Type Parameters

### S

`S` = `any`

Store state type (readonly).

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

## Properties

### effect

> **effect**: [`EffectFunction`](../type-aliases/EffectFunction.md)\<`S`, `EM`\>

Defined in: [types.ts:527](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L527)

Async effect handler: `(event, getState, emit) => void | Promise<void>`.

***

### ~~events?~~

> `optional` **events**: readonly [`EventKey`](../type-aliases/EventKey.md)\<`EM`\>[]

Defined in: [types.ts:522](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L522)

List of EventKeys `[channel, type]` that this effect responds to.

#### Deprecated

Use `when: { keys: [...] }` instead for better type inference.

***

### meta?

> `optional` **meta**: [`EventConsumerMeta`](EventConsumerMeta.md)\<`"effect"`\>

Defined in: [types.ts:532](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L532)

Optional metadata for debugging tools and DevTools integration.

***

### when?

> `optional` **when**: [`When`](../type-aliases/When.md)\<`EM`\>

Defined in: [types.ts:516](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L516)

Event targeting using the unified `When` matcher.
Preferred over `events` for new code.
