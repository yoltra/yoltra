![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / CallCancellation

# Interface: CallCancellation

Defined in: [store/call.ts:53](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L53)

What a responder is told when a [call](StoreInstance.md#call) gives up on it.

## Remarks

Sent as the payload of the event named by [CallOptions.cancel](CallOptions.md#cancel), so a responder doing long
work can stop it instead of finishing for nobody.

## Properties

### detail?

> `readonly` `optional` **detail**: `string`

Defined in: [store/call.ts:62](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L62)

The reason given to `cancel()`, or the signal's abort reason, as text.

***

### reason

> `readonly` **reason**: `"cancelled"` \| `"aborted"` \| `"timeout"`

Defined in: [store/call.ts:60](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L60)

Why: `"cancelled"` by `call.cancel()`, `"aborted"` by the call's `signal`, or `"timeout"`
after [CallOptions.timeoutMs](CallOptions.md#timeoutms) without a correlated event.

***

### requestId

> `readonly` **requestId**: `string`

Defined in: [store/call.ts:55](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L55)

The `id` of the request event being abandoned, which the responder saw as `event.id`.
