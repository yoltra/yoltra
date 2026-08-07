![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EmitOptions

# Interface: EmitOptions

Defined in: [types.ts:160](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L160)

Per-emit options.

## Properties

### dedupKey?

> `optional` **dedupKey**: `string`

Defined in: [types.ts:170](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L170)

Opt this specific emit into **identity-based** deduplication: if another
event with the same `(channel, type, dedupKey)` was emitted within the dedup
window, this one is skipped. Unlike content-based dedup
([StoreSpec.dedupWindowMs](../type-aliases/StoreSpec.md#dedupwindowms)), it never coalesces two *distinct* logical
emits that merely share a payload — only re-fires of the *same* keyed emit
(e.g. a React Strict Mode double-invoke). Works even when `dedupWindowMs`
is 0, using a short default window.

***

### id?

> `optional` **id**: `string`

Defined in: [types.ts:183](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L183)

Use this exact id for the event instead of generating one.

#### Remarks

Intended for **idempotent re-emission**: a caller replaying an event from elsewhere (a
peer store, a durable log) can preserve the original id so the same logical event keeps
one identity everywhere, which makes it traceable across systems and in DevTools.

The store does **not** enforce uniqueness — supplying a duplicate id does not dedupe the
event. Deduplication is a separate, opt-in concern; see [EmitOptions.dedupKey](#dedupkey).

***

### meta?

> `optional` **meta**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [types.ts:193](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L193)

Metadata to attach to this event, carried through the pipeline untouched and visible to
reducers, middleware, effects, subscribers and instrumentation. See [EventMeta](../type-aliases/EventMeta.md).

#### Remarks

Omitting this leaves `event.meta` genuinely absent rather than `undefined`, so event
objects are byte-identical to those produced before this option existed.

***

### skipDedup?

> `optional` **skipDedup**: `boolean`

Defined in: [types.ts:208](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L208)

Bypass deduplication for this emit entirely, even when the store was created with
[StoreSpec.dedupWindowMs](../type-aliases/StoreSpec.md#dedupwindowms) greater than 0.

#### Remarks

Content-based dedup fingerprints `(channel, type, payload)`, so a store with a dedup
window silently collapses genuinely distinct events that happen to share a payload —
repeated ticks with an empty payload, or the same event legitimately arriving twice from
two different sources. Set this when the caller already guarantees distinctness by other
means and needs every emit to land.

Takes precedence over both [EmitOptions.dedupKey](#dedupkey) and the store-level window.
