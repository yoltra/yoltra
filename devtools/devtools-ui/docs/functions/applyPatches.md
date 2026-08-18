![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / applyPatches

# Function: applyPatches()

> **applyPatches**\<`T`\>(`target`, `patches`): `T`

Defined in: [devtools-ui/src/utils/apply-patch.ts:43](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/utils/apply-patch.ts#L43)

Apply an array of RFC 6902 JSON Patch operations to a value.
Returns a new object -- does not mutate the input.

## Type Parameters

### T

`T` = `unknown`

## Parameters

### target

`T`

The value to patch.

### patches

`JsonPatch`[]

RFC 6902 operations.

## Returns

`T`

A new patched value.

## Remarks

Only the `add`, `remove`, and `replace` operations are implemented because
the v1 devtools protocol does not emit `move`, `copy`, or `test` patches.
Each operation is applied sequentially in array order. Path segments are
resolved according to RFC 6901 (JSON Pointer), including `~0` / `~1`
escape handling.

## Example

```ts
import { applyPatches } from "@yoltra/devtools-ui";

const next = applyPatches(
  { counter: { value: 0 } },
  [{ op: "replace", path: "/counter/value", value: 1 }],
);
// next => { counter: { value: 1 } }
```
