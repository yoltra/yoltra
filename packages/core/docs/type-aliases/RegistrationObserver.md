![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / RegistrationObserver

# Type Alias: RegistrationObserver()\<EM\>

> **RegistrationObserver**\<`EM`\> = (`changes`) => `void`

Defined in: [types.ts:2235](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2235)

Observer for [StoreInstance.onRegistrationChange](../interfaces/StoreInstance.md#onregistrationchange).

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md) = [`EventMapBase`](EventMapBase.md)

## Parameters

### changes

readonly [`RegistrationChange`](../interfaces/RegistrationChange.md)\<`EM`\>[]

## Returns

`void`
