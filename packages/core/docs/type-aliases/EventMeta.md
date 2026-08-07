[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EventMeta

# Type Alias: EventMeta

> **EventMeta** = `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [types.ts:73](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L73)

Opaque, optional envelope metadata carried alongside an [Event](../interfaces/Event.md).

## Remarks

The store never reads, validates or acts on this — it only carries it end to end, so
reducers, middleware, effects, event subscribers and instrumentation all observe the same
value. It is deliberately untyped at this level: consumers namespace their own keys (for
example a tracing integration keeping provenance under `meta.trace`) rather than
extending core with domain concepts.

It is **not** part of the deduplication fingerprint, which is computed from
`(channel, type, payload)` only. Two events differing solely in `meta` still dedupe.

## Example

```ts
await store.emit('orders', 'created', payload, {
  meta: { trace: { origin: 'checkout-service', hop: 1 } },
});
```
