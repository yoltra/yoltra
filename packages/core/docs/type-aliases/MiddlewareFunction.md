[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / MiddlewareFunction

# Type Alias: MiddlewareFunction()\<S, EM\>

> **MiddlewareFunction**\<`S`, `EM`\> = (`state`, `event`, `emit`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [types.ts:603](https://github.com/quojs/quojs/blob/7a847d68175722f00e52941458a1511185cf0a4e/packages/core/src/types.ts#L603)

Middleware function: may mutate, log, side-effect, or veto an event.
Return true to continue; false to swallow / cancel propagation.

## Type Parameters

### S

`S` = `any`

Store state (readonly).

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md) = [`EventMapBase`](EventMapBase.md)

Event map.

## Parameters

### state

`S`

### event

[`EventUnion`](EventUnion.md)\<`EM`\>

### emit

[`Emit`](Emit.md)\<`EM`\>

## Returns

`boolean` \| `Promise`\<`boolean`\>
