[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / JsonPatch

# Interface: JsonPatch

Defined in: [json-patch.ts:39](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/json-patch.ts#L39)

A single JSON Patch operation per RFC 6902.

## Remarks

Paths use JSON Pointer syntax (RFC 6901), e.g., `"/counter/value"`.
An array of these operations is carried inside every [StoreEvent](StoreEvent.md)
message, enabling extensions to reconstruct state incrementally
without requesting a full snapshot.

## Example

```ts
import type { JsonPatch } from "@yoltra/devtools-protocol";

const patch: JsonPatch = {
  op: "replace",
  path: "/counter/value",
  value: 42,
};
```

## Properties

### from?

> `optional` **from**: `string`

Defined in: [json-patch.ts:47](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/json-patch.ts#L47)

Source path for `move` and `copy` operations.

***

### op

> **op**: [`JsonPatchOp`](../type-aliases/JsonPatchOp.md)

Defined in: [json-patch.ts:41](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/json-patch.ts#L41)

The operation to perform.

***

### path

> **path**: `string`

Defined in: [json-patch.ts:43](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/json-patch.ts#L43)

Target path in JSON Pointer format (RFC 6901).

***

### value?

> `optional` **value**: `unknown`

Defined in: [json-patch.ts:45](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/json-patch.ts#L45)

Value for `add`, `replace`, and `test` operations.
