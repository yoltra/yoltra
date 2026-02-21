[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EffectFunction

# Type Alias: EffectFunction()\<S, EM\>

> **EffectFunction**\<`S`, `EM`\> = (`event`, `getState`, `emit`) => `void` \| `Promise`\<`void`\>

Defined in: [types.ts:720](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/types.ts#L720)

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
