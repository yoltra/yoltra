![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Emit

# Type Alias: Emit()\<EM\>

> **Emit**\<`EM`\> = \<`C`, `T`\>(`channel`, `type`, `payload`, `opts?`) => `Promise`\<[`EmitResult`](../interfaces/EmitResult.md)\>

Defined in: [types.ts:355](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L355)

Emits an event.

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

`Promise`\<[`EmitResult`](../interfaces/EmitResult.md)\>

## Remarks

**Channel and type are joined into one key, `"channel::type"`,** and dispatch, deduplication and
introspection all key on it. So two different pairs can collapse together: `("a::b", "c")` and
`("a", "b::c")` both become `"a::b::c"`, and a subscriber registered for one is invoked for the
other, while a dedup window lets one drop the other.

A `::` in a channel is fine on its own (it is how a peer's channel is namespaced), so
development builds warn on the **collision**, naming both pairs, rather than on the
separator. Nothing throws.
