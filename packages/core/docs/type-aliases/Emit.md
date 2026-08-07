[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Emit

# Type Alias: Emit()\<EM\>

> **Emit**\<`EM`\> = \<`C`, `T`\>(`channel`, `type`, `payload`, `opts?`) => `Promise`\<`void`\>

Defined in: [types.ts:211](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L211)

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

## Type Parameters

### C

`C` *extends* keyof `EM` & `string`

### T

`T` *extends* keyof `EM`\[`C`\] & `string`

## Parameters

### channel

`C`

### type

`T`

### payload

`EM`\[`C`\]\[`T`\]

### opts?

[`EmitOptions`](../interfaces/EmitOptions.md)

## Returns

`Promise`\<`void`\>
