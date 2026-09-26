![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / defineMiddleware

# Function: defineMiddleware()

> **defineMiddleware**\<`EMAdd`, `St`\>(): (`spec`) => [`MiddlewareSpec`](../interfaces/MiddlewareSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`St`\>, `EMAdd`\> & [`EventMapCarrier`](../interfaces/EventMapCarrier.md)\<`EMAdd`\>

Defined in: [types.ts:1986](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1986)

Declares a middleware spec together with the event map it contributes.

## Type Parameters

### EMAdd

`EMAdd` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md)

### St

`St` = `any`

## Returns

> (`spec`): [`MiddlewareSpec`](../interfaces/MiddlewareSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`St`\>, `EMAdd`\> & [`EventMapCarrier`](../interfaces/EventMapCarrier.md)\<`EMAdd`\>

### Parameters

#### spec

[`MiddlewareSpec`](../interfaces/MiddlewareSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`St`\>, `EMAdd`\>

### Returns

[`MiddlewareSpec`](../interfaces/MiddlewareSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`St`\>, `EMAdd`\> & [`EventMapCarrier`](../interfaces/EventMapCarrier.md)\<`EMAdd`\>

## Remarks

The spec form is the **only** form that can widen an event map. Identity at runtime.
