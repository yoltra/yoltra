![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / ReplySpec

# Type Alias: ReplySpec\<EM\>

> **ReplySpec**\<`EM`\> = readonly \[keyof `EM` & `string`\] \| readonly \[keyof `EM` & `string`, `string`\] \| readonly \[keyof `EM` & `string`, readonly `string`[]\]

Defined in: [store/call.ts:21](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L21)

Which reply events end a [call](../interfaces/StoreInstance.md#call), and therefore what it resolves to.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

## Remarks

Given as `[channel]` or `[channel, type]` or `[channel, [type, type]]`. The named types are
**terminal**: the first one to arrive settles the call. Every other correlated event on that
channel is progress.

Naming a channel alone makes every event on it terminal, which suits a responder with a single
kind of answer. Naming types is what lets a responder stream: `["rpc", ["answer", "error"]]`
ends on either, and anything else — `progress`, `partial`, `log` — flows to the consumer.
