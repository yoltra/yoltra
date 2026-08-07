[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / encodeState

# Function: encodeState()

> **encodeState**(`input`, `options`): [`EncodeResult`](../interfaces/EncodeResult.md)

Defined in: [serialize/codec.ts:90](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L90)

Encodes a value into something `JSON.stringify` can carry losslessly.

## Parameters

### input

`unknown`

Any value, including one holding `Map`, `Set`, `Date`, `BigInt` or cycles.

### options

[`EncodeOptions`](../interfaces/EncodeOptions.md) = `{}`

Redaction and size limits.

## Returns

[`EncodeResult`](../interfaces/EncodeResult.md)

The encoded value plus a report of anything that could not be represented.

## Example

```ts
const { value } = encodeState({ index: new Map([['a', 1]]) });
JSON.stringify(value); // safe, and decodeState restores the Map
```
