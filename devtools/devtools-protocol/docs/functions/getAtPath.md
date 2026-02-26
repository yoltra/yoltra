[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / getAtPath

# Function: getAtPath()

> **getAtPath**(`obj`, `dottedPath`): `any`

Defined in: [patch-utils.ts:30](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/patch-utils.ts#L30)

Walks a dotted path (e.g., `"counter.value"`) into an object.

## Parameters

### obj

`any`

Root object to traverse.

### dottedPath

`string`

Dot-separated path string.

## Returns

`any`

The value at the path, or `undefined` if unreachable.

## Remarks

Used internally by [computePatches](computePatches.md) to read old/new values
from state trees. Returns `undefined` when any intermediate
segment is `null` or `undefined`.

## Example

```ts
import { getAtPath } from "@yoltra/devtools-protocol";

const state = { counter: { value: 10 } };
getAtPath(state, "counter.value"); // 10
getAtPath(state, "missing.key");   // undefined
```
