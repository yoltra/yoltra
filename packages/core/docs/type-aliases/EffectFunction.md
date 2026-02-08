[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EffectFunction

# Type Alias: EffectFunction()\<S, EM\>

> **EffectFunction**\<`S`, `EM`\> = (`event`, `getState`, `emit`) => `void` \| `Promise`\<`void`\>

Defined in: [types.ts:625](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L625)

Effect handler: runs AFTER reducers, sees the final state.

## Type Parameters

### S

`S` = `any`

Store state (readonly).

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md) = [`EventMapBase`](EventMapBase.md)

Event map.

## Parameters

### event

[`EventUnion`](EventUnion.md)\<`EM`\>

### getState

() => `S`

### emit

[`Emit`](Emit.md)\<`EM`\>

## Returns

`void` \| `Promise`\<`void`\>
