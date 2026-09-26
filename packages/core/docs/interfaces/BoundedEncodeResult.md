![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / BoundedEncodeResult

# Interface: BoundedEncodeResult

Defined in: [serialize/codec.ts:504](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L504)

Outcome of [encodeStateBounded](../functions/encodeStateBounded.md).

## Properties

### note?

> `readonly` `optional` **note**: `string`

Defined in: [serialize/codec.ts:510](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L510)

Explains what was dropped, for display beside a partial tree.

***

### truncated

> `readonly` **truncated**: `boolean`

Defined in: [serialize/codec.ts:508](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L508)

`true` when the state did not fit and parts were replaced by markers.

***

### value

> `readonly` **value**: `unknown`

Defined in: [serialize/codec.ts:506](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L506)

The encoded value, small enough to send.
