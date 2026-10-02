![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / defineEffect

# Function: defineEffect()

> **defineEffect**\<`EMAdd`, `St`\>(): (`spec`) => [`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`St`\>, `EMAdd`\> & [`EventMapCarrier`](../interfaces/EventMapCarrier.md)\<`EMAdd`\>

Defined in: [types.ts:2418](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2418)

Declares an effect spec together with the event map it contributes.

## Type Parameters

### EMAdd

`EMAdd` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md)

### St

`St` = `any`

## Returns

> (`spec`): [`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`St`\>, `EMAdd`\> & [`EventMapCarrier`](../interfaces/EventMapCarrier.md)\<`EMAdd`\>

### Parameters

#### spec

[`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`St`\>, `EMAdd`\>

### Returns

[`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`St`\>, `EMAdd`\> & [`EventMapCarrier`](../interfaces/EventMapCarrier.md)\<`EMAdd`\>

## Remarks

Identity at runtime.
