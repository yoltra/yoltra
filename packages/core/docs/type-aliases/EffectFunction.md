![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EffectFunction

# Type Alias: EffectFunction()\<S, EM\>

> **EffectFunction**\<`S`, `EM`\> = (`event`, `getState`, `emit`, `ctx`) => `void` \| `Promise`\<`void`\>

Defined in: [types.ts:1734](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1734)

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

### ctx

[`EffectContext`](../interfaces/EffectContext.md)

## Returns

`void` \| `Promise`\<`void`\>

## Remarks

The fourth argument is optional to declare, so an effect written with three parameters is still
an `EffectFunction`.
