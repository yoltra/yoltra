![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / matchesWhen

# Function: matchesWhen()

> **matchesWhen**\<`EM`\>(`when`, `event`): `boolean`

Defined in: [store/matching.ts:54](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/matching.ts#L54)

Checks if an event matches a `When` matcher.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md)

## Parameters

### when

The When matcher (or undefined for "all events").

`undefined` | [`When`](../type-aliases/When.md)\<`EM`\>

### event

`Pick`\<[`EventUnion`](../type-aliases/EventUnion.md)\<`EM`\>, `"channel"` \| `"type"`\>

The event to check.

## Returns

`boolean`

`true` if the event matches, `false` otherwise.

## Remarks

- `undefined` or missing `when` matches ALL events.
- `{ any: true }` matches ALL events.
- `{ keys: [...] }` matches if event's `[channel, type]` is in the array.
- `{ channel: 'x' }` matches if event's channel equals 'x'.
- `{ channels: ['x', 'y'] }` matches if event's channel is in the array.
- `{ channelPattern: '*::plan' }` matches if event's channel matches the pattern, `*` standing
  for zero or more characters.

This is the matcher every seam of the store uses. It is exported so code that filters events by
the same `When` a consumer would declare (a capture filter, a router, a test helper) gets the
store's semantics exactly instead of a copy that can drift. It reads only `channel` and `type`,
so an [InstrumentedEvent](../interfaces/InstrumentedEvent.md)'s `event`, or any `{ channel, type }`, can be passed as is.

## Example

```ts
store.instrument((info) => {
  if (matchesWhen({ channels: ["orders", "billing"] }, info.event)) record(info);
});
```
