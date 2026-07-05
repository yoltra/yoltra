[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / When

# Type Alias: When\<EM\>

> **When**\<`EM`\> = \{ `any`: `true`; \} \| \{ `keys`: `ReadonlyArray`\<[`EventKey`](EventKey.md)\<`EM`\>\>; \} \| \{ `channel`: keyof `EM` & `string`; \} \| \{ `channels`: `ReadonlyArray`\<keyof `EM` & `string`\>; \}

Defined in: [types.ts:928](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L928)

Matcher for event targeting across reducers, effects, middleware, and subscriptions.

Supports four targeting modes:
- `{ any: true }` — match all events
- `{ keys: [...] }` — match specific `[channel, type]` pairs (correlated)
- `{ channel: 'x' }` — match all events in a channel
- `{ channels: ['x', 'y'] }` — match all events in multiple channels

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.

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
