![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EncodeReport

# Interface: EncodeReport

Defined in: [serialize/codec.ts:173](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L173)

Reports what an encode had to compromise. Empty when nothing was lost.

## Properties

### truncated

> `readonly` **truncated**: `boolean`

Defined in: [serialize/codec.ts:175](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L175)

Node budget was exhausted and some subtrees were replaced by markers.

***

### unsupported

> `readonly` **unsupported**: readonly `string`[]

Defined in: [serialize/codec.ts:177](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L177)

Values no JSON representation exists for, by path — functions, symbols, DOM nodes.
