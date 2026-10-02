![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EffectsObserver

# Type Alias: EffectsObserver()\<EM\>

> **EffectsObserver**\<`EM`\> = (`info`) => `void`

Defined in: [types.ts:514](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L514)

Receives an [InstrumentedEffects](../interfaces/InstrumentedEffects.md) per event whose effects ran.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md) = [`EventMapBase`](EventMapBase.md)

## Parameters

### info

[`InstrumentedEffects`](../interfaces/InstrumentedEffects.md)\<`EM`\>

## Returns

`void`
