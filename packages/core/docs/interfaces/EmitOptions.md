[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EmitOptions

# Interface: EmitOptions

Defined in: [types.ts:129](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L129)

Per-emit options.

## Properties

### dedupKey?

> `optional` **dedupKey**: `string`

Defined in: [types.ts:139](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L139)

Opt this specific emit into **identity-based** deduplication: if another
event with the same `(channel, type, dedupKey)` was emitted within the dedup
window, this one is skipped. Unlike content-based dedup
([StoreSpec.dedupWindowMs](../type-aliases/StoreSpec.md#dedupwindowms)), it never coalesces two *distinct* logical
emits that merely share a payload — only re-fires of the *same* keyed emit
(e.g. a React Strict Mode double-invoke). Works even when `dedupWindowMs`
is 0, using a short default window.
