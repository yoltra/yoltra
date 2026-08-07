[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / encodeStateBounded

# Function: encodeStateBounded()

> **encodeStateBounded**(`input`, `maxBytes`, `options`): [`BoundedEncodeResult`](../interfaces/BoundedEncodeResult.md)

Defined in: [serialize/codec.ts:353](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L353)

Encodes a value, shrinking it until its serialized form fits within `maxBytes`.

## Parameters

### input

`unknown`

Any value.

### maxBytes

`number`

Byte budget for the serialized form.

### options

[`EncodeOptions`](../interfaces/EncodeOptions.md) = `{}`

Passed through to [encodeState](encodeState.md).

## Returns

[`BoundedEncodeResult`](../interfaces/BoundedEncodeResult.md)

The encoded value and whether anything had to be dropped.

## Remarks

A frame larger than the hub's cap is not merely slow — it is rejected, and the connection with
it, so the client reconnects, asks again, is refused again, and the panel sits waiting through
a loop with nothing on screen to explain it. The size therefore has to be bounded before the
frame is sent rather than discovered afterwards.

Node count is a poor proxy for bytes: a hundred nodes holding base64 blobs outweigh a hundred
thousand holding integers. So this measures the encoded output and, when it is too large,
scales the node budget by how far over it went and measures again. Scaling by the overshoot
rather than halving matters: from a default of a hundred thousand nodes, repeated halving
needs a dozen rounds to reach the hundreds, so a state that could have been shown in part
would have been abandoned instead.

Truncation is reported rather than performed silently. A partial tree presented as the state is
worse than no tree at all: a debugger that quietly lies about state is not a debugger.
