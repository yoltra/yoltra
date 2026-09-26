![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / BoundedEncodeResult

# Interface: BoundedEncodeResult

Defined in: [serialize/codec.ts:556](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L556)

Outcome of [encodeStateBounded](../functions/encodeStateBounded.md).

## Properties

### note?

> `readonly` `optional` **note**: `string`

Defined in: [serialize/codec.ts:562](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L562)

Explains what was dropped, for display beside a partial tree.

***

### truncated

> `readonly` **truncated**: `boolean`

Defined in: [serialize/codec.ts:560](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L560)

`true` when the state did not fit and parts were replaced by markers.

***

### value

> `readonly` **value**: `unknown`

Defined in: [serialize/codec.ts:558](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L558)

The encoded value, small enough to send.
