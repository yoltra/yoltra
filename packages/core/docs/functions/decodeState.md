[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / decodeState

# Function: decodeState()

> **decodeState**(`input`): `unknown`

Defined in: [serialize/codec.ts:197](https://github.com/yoltra/yoltra/blob/main/packages/core/src/serialize/codec.ts#L197)

Reverses [encodeState](encodeState.md).

## Parameters

### input

`unknown`

A value produced by `encodeState` (typically after a JSON round trip).

## Returns

`unknown`

The original structure, with `Map`, `Set`, `Date` and friends restored.

## Remarks

Unsupported markers decode to `undefined`: a function cannot be reconstructed, and inventing a
placeholder would be worse than an absent value. Cycles are restored by resolving references
after the tree is built, so a decoded structure is cyclic exactly where the original was.
