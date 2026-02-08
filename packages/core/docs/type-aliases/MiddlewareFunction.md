[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / MiddlewareFunction

# Type Alias: MiddlewareFunction()\<S, EM\>

> **MiddlewareFunction**\<`S`, `EM`\> = (`state`, `event`, `emit`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [types.ts:557](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L557)

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
