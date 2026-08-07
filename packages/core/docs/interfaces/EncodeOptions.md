![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EncodeOptions

# Interface: EncodeOptions

Defined in: [serialize/codec.ts:40](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L40)

Options for [encodeState](../functions/encodeState.md).

## Properties

### maxNodes?

> `readonly` `optional` **maxNodes**: `number`

Defined in: [serialize/codec.ts:58](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L58)

Maximum number of nodes to encode. Beyond it, subtrees are replaced by a truncation marker.

#### Remarks

A snapshot larger than the hub's frame cap is rejected outright, which reads to the user as
a panel that hangs. Truncating visibly is a better failure: the panel renders, and says
where it stopped. Defaults to 100000.

***

### sanitize()?

> `readonly` `optional` **sanitize**: (`path`, `value`) => `unknown`

Defined in: [serialize/codec.ts:49](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L49)

Redacts a value before it leaves the process.

#### Parameters

##### path

`string`

##### value

`unknown`

#### Returns

`unknown`

#### Remarks

State frequently holds tokens, session material and personal data, and devtools traffic
crosses a socket to another process. Return the replacement value, or the value itself to
keep it. Applied before encoding, so a redacted value is encoded like any other.
