[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / BoundedEncodeResult

# Interface: BoundedEncodeResult

Defined in: [serialize/codec.ts:317](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L317)

Outcome of [encodeStateBounded](../functions/encodeStateBounded.md).

## Properties

### note?

> `readonly` `optional` **note**: `string`

Defined in: [serialize/codec.ts:323](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L323)

Explains what was dropped, for display beside a partial tree.

***

### truncated

> `readonly` **truncated**: `boolean`

Defined in: [serialize/codec.ts:321](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L321)

`true` when the state did not fit and parts were replaced by markers.

***

### value

> `readonly` **value**: `unknown`

Defined in: [serialize/codec.ts:319](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L319)

The encoded value, small enough to send.
