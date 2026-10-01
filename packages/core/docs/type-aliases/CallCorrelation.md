![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / CallCorrelation

# Type Alias: CallCorrelation

> **CallCorrelation** = `"either"` \| `"causal"` \| `"id"`

Defined in: [store/call.ts:42](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L42)

Which link correlates a reply with its [call](../interfaces/StoreInstance.md#call).

## Remarks

- `"either"`: the parent link, or an echoed [CallOptions.correlationId](../interfaces/CallOptions.md#correlationid). The default.
- `"causal"`: the parent link only. An echoed id is ignored, even when one is set.
- `"id"`: the echoed `correlationId` only. Requires `correlationId`.

`"id"` exists for a responder whose protocol already carries its own request id, typically one
that answers across a transport and keeps several requests in flight on one channel. There, the
parent link can point at the wrong request: a reply emitted while a *different* request is
being handled descends from that one, and under `"either"` it would settle whichever call
matched first.
